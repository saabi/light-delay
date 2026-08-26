# Signal Beam Requirements — Working Notes

> Status: non-canonical engineering aid. The Spanish screenplay and `docs/technical/CELESTIAL_ARDOR.md` are authoritative. This file preserves useful scale estimates from an older version while removing its FTL-drive and radio-transmitter assumptions.

## 1. Interception geometry

- **Canonical signal travel:** approximately 23 h 15 min across 167.8 AU.
- **Target:** the future flight corridor of Celestial Ardor after it crosses the Velari wormhole, not an FTL exit point.
- **Source solution:** the loaded flight plan, light-time and the ship's expected future state provide the centre of an uncertainty ellipse.
- **Coverage:** natural beam divergence covers part of that ellipse; a narrow raster covers the remainder. The transmitted packet repeats throughout the raster.
- **Inherited scale check:** the former 19.4-million-km uncertainty at roughly 173 AU implied about **0.043°**. This remains a visual-order estimate only; it is not current canon until trajectory uncertainty, aperture and wavelength are recalculated together.

## 2. Optical link budget

The previous estimate assumed a 1–10 GHz radio link, a 30 m transmitting dish and 5–50 kW. Those values do **not** specify the current optical system and must not appear as settled facts in dialogue or UI.

Current screenplay requirements:

- Celestial Ardor has a standard external laser for long-distance communications.
- Its local pointing control uses a dedicated physical route independent of the wireless mesh and deck COM A/B distributor.
- The ship's receiver can acquire the repeated packet while performing the already-required Velari approach observations.
- Exact wavelength, aperture, pulse energy, coding gain and receiver sensitivity remain an engineering TODO.

## 3. Narrative precision requirements

The sequence must communicate the following visually:

1. Earth is rejected because the warning would arrive after the meeting.
2. Proxima has no usable optical acquisition path at that moment.
3. The future ship corridor is the only useful destination.
4. Missing the uncertainty ellipse loses the signal.
5. Zao must refine the raster while Harlan is approaching.
6. Harlan sees that a transmission completed but not where it was aimed.

Suggested interface elements are a predicted track, a light-time intercept, an uncertainty ellipse, the divergent footprint, the residual raster and a visible completion percentage. They should reveal Zao's reasoning without explanatory dialogue.

Do not turn these controls into spoken exposition. The audience only needs to understand destination, risk of missing and time pressure.
