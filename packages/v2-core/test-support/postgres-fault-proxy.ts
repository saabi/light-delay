import net, { type Socket } from 'node:net';

/** Test-only PostgreSQL wire proxy. Holds exactly one write COMMIT, including its
 * following EOF, so pg's real query_timeout fires without cancelling server work.
 * TLS is deliberately disabled on this loopback-only test connection. */
export async function postgresFaultProxy(databaseUrl: string) {
	const target = new URL(databaseUrl);
	const sockets = new Set<Socket>();
	let armed = false;
	let held: { backend: Socket; bytes: Buffer; client: Socket } | undefined;
	let heldResolve: (() => void) | undefined;
	let holdReached: Promise<void> = Promise.resolve();
	const server = net.createServer({ allowHalfOpen: true }, (client) => {
		const backend = net.connect({ host: target.hostname, port: Number(target.port || 5432) });
		backend.setNoDelay(true);
		client.setNoDelay(true);
		sockets.add(client);
		sockets.add(backend);
		let startup = true;
		let buffer = Buffer.alloc(0);
		let writing = false;
		backend.on('data', (bytes) => {
			if (!client.destroyed && !client.writableEnded) client.write(bytes);
		});
		backend.on('end', () => client.end());
		backend.on('error', () => client.destroy());
		client.on('error', () => {
			if (held?.client !== client) backend.destroy();
		});
		client.on('end', () => {
			// pg discards its client on deadline; keep the backend transaction alive
			// until the harness explicitly delivers COMMIT or drops the connection.
			if (held?.client !== client) backend.end();
		});
		for (const socket of [client, backend]) socket.on('close', () => sockets.delete(socket));
		client.on('data', (bytes) => {
			buffer = Buffer.concat([buffer, bytes]);
			while (buffer.length >= (startup ? 4 : 5)) {
				const length = buffer.readInt32BE(startup ? 0 : 1) + (startup ? 0 : 1);
				if (buffer.length < length) return;
				const message = buffer.subarray(0, length);
				buffer = buffer.subarray(length);
				if (startup) {
					startup = false;
					backend.write(message);
					continue;
				}
				const type = String.fromCharCode(message[0]);
				const sql =
					type === 'Q'
						? message.subarray(5, -1).toString()
						: type === 'P'
							? message
									.subarray(message.indexOf(0, 5) + 1)
									.toString()
									.split('\0')[0]
							: '';
				if (/^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql)) writing = true;
				if (armed && writing && /^COMMIT\s*;?$/i.test(sql)) {
					armed = false;
					held = { backend, bytes: message, client };
					heldResolve?.();
				} else if (held?.client === client) {
					held.bytes = Buffer.concat([held.bytes, message]);
				} else {
					backend.write(message);
					if (/^(COMMIT|ROLLBACK)\b/i.test(sql)) writing = false;
				}
			}
		});
	});
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address() as net.AddressInfo;
	const url = new URL(databaseUrl);
	url.hostname = '127.0.0.1';
	url.port = String(address.port);
	url.searchParams.set('sslmode', 'disable');
	return {
		url: url.toString(),
		arm() {
			if (held || armed) throw new Error('A COMMIT fault is already armed');
			armed = true;
			holdReached = new Promise<void>((resolve) => {
				heldResolve = resolve;
			});
		},
		get holdReached() {
			return holdReached;
		},
		release() {
			if (!held) throw new Error('No COMMIT was captured');
			const { backend, bytes, client } = held;
			held = undefined;
			backend.write(bytes);
			if (client.readableEnded || client.destroyed) backend.end();
		},
		abort() {
			if (!held) throw new Error('No COMMIT was captured');
			const { backend, client } = held;
			held = undefined;
			backend.destroy();
			client.destroy();
		},
		async close() {
			for (const socket of sockets) socket.destroy();
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	};
}
