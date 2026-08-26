import sharp from 'sharp';

await Promise.all([
	sharp('static/favicon.svg').resize(32, 32).png().toFile('static/favicon-32x32.png'),
	sharp('static/favicon.svg').resize(180, 180).png().toFile('static/apple-touch-icon.png'),
	sharp('static/favicon.svg').resize(192, 192).png().toFile('static/icon-192.png'),
	sharp('static/favicon.svg').resize(512, 512).png().toFile('static/icon-512.png'),
	sharp('static/brand/social-card.svg')
		.resize(1200, 630)
		.png()
		.toFile('static/brand/social-card.png')
]);

console.log('Generated favicon, app icons, and social card.');
