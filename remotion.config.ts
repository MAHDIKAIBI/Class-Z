import { Config } from '@remotion/cli/config';

// Premium render settings
// Config.setConcurrency(16); // Auto-scaling enabled // Max out all 16 logical cores
Config.setVideoImageFormat('jpeg'); // Lightning fast compared to PNG
Config.setJpegQuality(90); // Slightly reduce from 100 to 90 for massive speed boost with no visual loss
Config.setOverwriteOutput(true);
Config.setBrowserExecutable(null);


// Hardware Acceleration (Force NVIDIA NVENC on Linux/Colab T4)
Config.setHardwareAcceleration('if-possible');

// Quality optimizations (CRF is INCOMPATIBLE with hardware acceleration - use bitrate instead)
// Config.setCrf(16); // DISABLED - breaks NVENC
Config.setPixelFormat('yuv420p');
Config.setDelayRenderTimeoutInMilliseconds(120000);
