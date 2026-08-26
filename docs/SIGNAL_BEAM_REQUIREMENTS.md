# Signal Strength and Beam Width Requirements

## Signal Requirements

### 1. Position Uncertainty

- **Distance:** 173 AU (24 light-hours)
- **Ship velocity post-FTL:** ~300 km/s (about 0.1% of lightspeed)
- **18-hour drift:**  
  300 km/s × 64,800s = **19.4 million km**
- **Beam angle needed:**  
  arctan(19.4 million km / 25.9 billion km) = **0.043°** (43 millidegrees)

### 2. Power Requirements

For a signal sent over this distance with reasonable assumptions:

- **Transmitter dish:** 30m (at Jupiter)
- **Receiver dish:** 10m (on ship)
- **Frequency:** 1–10 GHz (optimal for deep space)
- **Required power:** 5–50 kilowatts

This is actually quite reasonable! Deep space missions like Voyager receive signals from 20 W transmitters, but use massive 70m receiver dishes on Earth.

---

## FTL Navigation Precision

This is where it gets tricky:

### 1. FTL Exit Uncertainty

Realistic estimates for FTL exit precision:

- **Best case:** ±1 million km (0.007 AU)
- **Typical:** ±10 million km (0.07 AU)
- **Worst case:** ±100 million km (0.7 AU)

### 2. Sublight Drift

After FTL exit, in 18 hours at 300 km/s:

- **Additional uncertainty:** 19.4 million km
- **Total uncertainty radius:** ~30–120 million km

### 3. Prediction Accuracy

The crew could predict their position using:

- Pre-FTL trajectory calculations
- Known FTL drive characteristics
- Gravitational field modeling
- Previous jump calibration data

Note: these are general considerations from older versions of the script. We should use them as approximations for the optical laser signal, but if not applicable, laser optics and physics have to be considered.