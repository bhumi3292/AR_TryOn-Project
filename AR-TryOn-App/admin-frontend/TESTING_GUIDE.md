# 🎨 Visual Testing Guide - AR Jewelry Try-On

## Step-by-Step Testing Instructions

### Step 1: Start the Application ✅

The development server is already running at:
```
http://localhost:3000
```

### Step 2: Navigate to AR Test Page

Open your browser and go to:
```
http://localhost:3000/ar-test
```

### Step 3: Allow Camera Access

When prompted:
1. Click "Allow" for camera permissions
2. Wait for "AR Active" indicator
3. Position your face in the camera view

### Step 4: Enter Model URL

In the "Model URL" field, enter one of:

**Option 1: Local Backend Model**
```
http://localhost:5000/ml-output/[product-id].glb
```

**Option 2: Test with Sample Models**
If you have sample GLB files, you can use:
```
http://localhost:5000/ml-output/sample-necklace.glb
http://localhost:5000/ml-output/sample-earring.glb
http://localhost:5000/ml-output/sample-nosepin.glb
```

**Option 3: External Test Models**
For testing without backend, you can use public GLB models:
```
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb
```
(Note: This is just for testing the AR system, not actual jewelry)

### Step 5: Select Category

Click on the category button:
- **Necklace** - Anchors to chin (landmark 152)
- **Earring** - Anchors to ears (landmarks 234, 454)
- **Nosepin** - Anchors to nose tip (landmark 4)

### Step 6: Adjust Controls

Use the sliders to fine-tune:
- **Scale**: Make jewelry bigger/smaller (0.1 - 3.0)
- **X Position**: Move left/right (-1.0 - 1.0)
- **Y Rotation**: Rotate around vertical axis (-π - π)
- **Z Rotation**: Rotate around depth axis (-π - π)

### Step 7: Test Face Tracking

Try these movements to test tracking:
1. ✅ Turn head left and right
2. ✅ Move closer and farther from camera
3. ✅ Tilt head up and down
4. ✅ Move around the frame

**Expected Behavior:**
- Jewelry should follow your face smoothly
- No jittering or shaking
- Proper scaling as you move closer/farther
- Earrings should disappear behind face when turning

## 🎯 What to Look For

### ✅ Good Tracking Indicators
- Green "AR Active" badge
- Jewelry follows face smoothly
- No lag or jitter
- Proper depth perception (occlusion)
- Jewelry scales with face distance

### ❌ Issues to Watch For
- "No face detected" message (improve lighting)
- Jittery movement (adjust smoothing factor)
- Jewelry not appearing (check model URL)
- Camera not starting (check permissions)

## 🔧 Troubleshooting During Testing

### Issue: Camera Not Starting
**Solution:**
1. Check browser permissions (click lock icon in address bar)
2. Close other apps using camera (Zoom, Teams, etc.)
3. Try different browser (Chrome recommended)
4. Refresh the page

### Issue: No Face Detected
**Solution:**
1. Improve lighting (face should be well-lit)
2. Face camera directly
3. Move closer to camera
4. Remove glasses if causing issues

### Issue: Jewelry Not Appearing
**Solution:**
1. Verify model URL is correct
2. Check browser console for errors (F12)
3. Ensure backend is running (if using local models)
4. Try a different model URL

### Issue: Jittery Movement
**Solution:**
1. Stay still for a moment to let tracking stabilize
2. Improve lighting conditions
3. Reduce camera resolution if needed
4. Adjust smoothing factor in code (see below)

## ⚙️ Advanced Configuration

### Adjust Smoothing Factor

Edit `src/components/JewelryAnchor.jsx`:

```javascript
// Line ~150
const smoothingFactor = 0.3; // Try values between 0.1 - 0.5

// Lower values (0.1-0.2):
// - Smoother motion
// - More lag
// - Better for shaky cameras

// Higher values (0.4-0.5):
// - More responsive
// - Less smooth
// - Better for stable cameras
```

### Adjust Landmark Offsets

Edit `src/components/JewelryAnchor.jsx`:

```javascript
// For necklace - make it hang lower
necklace: {
  offset: { x: 0, y: -0.7, z: 0 }, // Increase Y offset
}

// For earrings - move them down
earring: {
  offset: { x: 0, y: -0.05, z: 0 }, // Increase Y offset
}

// For nosepin - move it forward
nosepin: {
  offset: { x: 0, y: 0, z: 0.03 }, // Increase Z offset
}
```

### Adjust Base Scales

Edit `src/components/JewelryAnchor.jsx`:

```javascript
nosepin: { baseScale: 0.10 },  // Make nose pins bigger
earring: { baseScale: 0.08 },  // Make earrings bigger
necklace: { baseScale: 0.30 }, // Make necklaces bigger
```

## 📊 Performance Testing

### Check FPS (Frames Per Second)

Open browser console (F12) and look for performance metrics.

**Expected FPS:**
- Desktop: 50-60 FPS
- Laptop: 30-50 FPS
- Mobile: 20-30 FPS

**If FPS is low (<20):**
1. Close other browser tabs
2. Reduce camera resolution
3. Use smaller GLB models
4. Disable other extensions

### Check Memory Usage

In browser console:
```javascript
console.log(performance.memory);
```

**Expected Memory:**
- Initial: ~50-100 MB
- After 5 minutes: ~100-150 MB
- If > 300 MB: Possible memory leak

## 🎨 Testing Different Jewelry Types

### Testing Necklaces
1. Select "Necklace" category
2. Load necklace model
3. Check if it anchors to chin
4. Verify it hangs down naturally
5. Test rotation when turning head

### Testing Earrings
1. Select "Earring" category
2. Load earring model
3. Check if both ears have earrings
4. Turn head left/right
5. Verify earrings go behind face

### Testing Nose Pins
1. Select "Nosepin" category
2. Load nosepin model
3. Check if it anchors to nose tip
4. Verify rotation follows nose direction
5. Test with different face angles

## 📸 Capture Test Results

### Take Screenshots
1. Position jewelry correctly
2. Press F12 to open developer tools
3. Right-click on canvas
4. Select "Save image as..."

### Record Video (Optional)
1. Use browser screen recording
2. Or use OBS Studio
3. Record 30-second test
4. Show different face angles

## ✅ Testing Checklist

Before marking as complete, verify:

- [ ] Camera initializes successfully
- [ ] Face is detected within 2 seconds
- [ ] Jewelry appears at correct position
- [ ] Smoothing works (no jitter)
- [ ] Dynamic scaling works (move closer/farther)
- [ ] Occlusion works (earrings behind face)
- [ ] Manual controls work (scale, position, rotation)
- [ ] Reset button works
- [ ] No console errors
- [ ] Performance is acceptable (>20 FPS)
- [ ] Works in different lighting conditions
- [ ] Works with different face angles

## 🎯 Success Criteria

**The AR system is working correctly if:**

1. ✅ Camera starts automatically
2. ✅ Face is detected reliably
3. ✅ Jewelry tracks face smoothly
4. ✅ No visible jitter or lag
5. ✅ Jewelry scales with distance
6. ✅ Occlusion works for earrings
7. ✅ Manual controls are responsive
8. ✅ No errors in console
9. ✅ FPS is above 20
10. ✅ Works for all jewelry types

## 📝 Test Report Template

After testing, document your results:

```
AR System Test Report
Date: [Date]
Browser: [Chrome/Firefox/Safari]
Device: [Desktop/Laptop/Mobile]

Camera Initialization: [Pass/Fail]
Face Detection: [Pass/Fail]
Jewelry Tracking: [Pass/Fail]
Smoothing: [Pass/Fail]
Dynamic Scaling: [Pass/Fail]
Occlusion: [Pass/Fail]
Manual Controls: [Pass/Fail]
Performance (FPS): [Number]

Issues Found:
1. [Issue description]
2. [Issue description]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

## 🚀 Next Steps After Testing

Once testing is complete:

1. ✅ Document any issues found
2. ✅ Adjust configuration as needed
3. ✅ Test with real jewelry models
4. ✅ Integrate with backend
5. ✅ Test on different devices
6. ✅ Optimize performance
7. ✅ Deploy to production

## 💡 Pro Tips

1. **Best Lighting**: Natural daylight or soft white LED
2. **Best Distance**: 1-2 feet from camera
3. **Best Angle**: Face camera directly, slight downward tilt
4. **Best Browser**: Chrome or Edge for best performance
5. **Best Models**: GLB files under 5MB, optimized textures

---

**Happy Testing! 🎉**

If you encounter any issues, refer to:
- `QUICK_START.md` for setup help
- `AR_SYSTEM_README.md` for technical details
- `ARCHITECTURE.md` for system design
