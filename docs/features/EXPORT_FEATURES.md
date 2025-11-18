# Export Features Documentation

## Overview

The LAB Visualizer platform provides comprehensive export capabilities for visualizations, 3D models, annotated documents, and session state. The export system is designed to be flexible, performant, and easy to integrate.

## Features

### 1. Image Export

Export high-quality screenshots of molecular visualizations.

**Formats:**
- PNG (with optional transparency)
- JPEG (with quality control)
- WebP (modern format with better compression)

**Resolutions:**
- 720p (SD) - 1280x720
- 1080p (HD) - 1920x1080
- 1440p (Full HD) - 2560x1440
- 2160p (4K) - 3840x2160
- Custom - User-defined dimensions

**Features:**
- Include/exclude annotations
- Transparent backgrounds (PNG only)
- Watermark support with customizable position and opacity
- Quality control for JPEG/WebP
- Background color customization

### 2. 3D Model Export

Export molecular structures as 3D models for use in other software.

**Formats:**
- glTF/GLB - Modern, efficient format for web and desktop
- OBJ - Universal format supported by most 3D software
- STL - For 3D printing and CAD applications

**Features:**
- Include colors, normals, and textures
- Geometry optimization
- Adjustable scale
- Binary vs. JSON formats (glTF)
- Embedded textures option

### 3. PDF Export

Generate annotated PDF documents with structure images and notes.

**Features:**
- High-resolution structure images
- Annotation listing with metadata
- Visualization settings documentation
- Customizable page size and orientation
- Configurable margins and styling
- Author and title metadata

**Page Sizes:**
- Letter (8.5" x 11")
- A4 (210mm x 297mm)
- Legal (8.5" x 14")

### 4. Session State Export

Save and restore complete viewer state.

**Includes:**
- Camera position, target, zoom, and rotation
- All annotations with full metadata
- Current selection
- Visualization settings (representation, colors, etc.)
- Structure ID and metadata

**Format:**
- JSON (with optional pretty printing)
- Versioned for future compatibility

## Architecture

### Components

```
src/
├── types/export.ts              # TypeScript definitions
├── services/export-service.ts   # Core export logic
├── components/viewer/
│   └── ExportPanel.tsx         # UI controls
├── hooks/use-export.ts         # React hook for state management
└── app/api/export/
    ├── image/route.ts          # Image export endpoint
    ├── model/route.ts          # 3D model export endpoint
    └── pdf/route.ts            # PDF export endpoint
```

### Design Patterns

1. **Singleton Service**: `ExportService` uses singleton pattern for centralized state
2. **Strategy Pattern**: Different export formats use pluggable converters
3. **Observer Pattern**: Progress callbacks for long-running operations
4. **Adapter Pattern**: `ExportableViewer` interface for MolStar integration

## Usage

### Basic Image Export

```typescript
import { useExport } from '@/hooks/use-export';
import { ExportPanel } from '@/components/viewer/ExportPanel';

function MyComponent() {
  const { exportImage, downloadResult, isExporting, progress } = useExport({
    viewer: molstarViewer,
    onSuccess: (result) => {
      console.log('Export complete:', result);
      downloadResult(result);
    }
  });

  return (
    <div>
      <button onClick={() => exportImage({ format: 'png', resolution: 'hd' })}>
        Export Image
      </button>
      {isExporting && <div>Progress: {progress?.progress}%</div>}
    </div>
  );
}
```

### Using ExportPanel Component

```typescript
import { ExportPanel } from '@/components/viewer/ExportPanel';
import { useExport } from '@/hooks/use-export';

function ViewerPage() {
  const {
    exportImage,
    export3DModel,
    exportPDF,
    exportSession,
    downloadResult,
    isExporting,
    progress
  } = useExport({
    viewer: molstarViewer,
    onSuccess: downloadResult
  });

  return (
    <ExportPanel
      onExportImage={exportImage}
      onExport3DModel={export3DModel}
      onExportPDF={exportPDF}
      onExportSession={exportSession}
      isExporting={isExporting}
      progress={progress}
    />
  );
}
```

### Advanced: Custom Progress Handling

```typescript
import { exportService } from '@/services/export-service';

async function exportWithProgress() {
  const result = await exportService.exportImage(
    viewer,
    {
      format: 'png',
      resolution: ImageResolution.ULTRA_HD,
      includeAnnotations: true
    },
    (progress) => {
      console.log(`${progress.stage}: ${progress.progress}%`);
      console.log(progress.message);

      if (progress.stage === 'error') {
        console.error('Export failed:', progress.error);
      }
    }
  );

  // Download the result
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
}
```

### 3D Model Export with Options

```typescript
const result = await export3DModel({
  format: 'gltf',
  includeTextures: true,
  includeColors: true,
  includeNormals: true,
  optimizeGeometry: true,
  scale: 1.5,
  binary: true,
  embedTextures: true
});

// Download main file
downloadResult(result);

// Additional files (textures, materials) are downloaded automatically
```

### PDF Export with Full Options

```typescript
const result = await exportPDF({
  title: 'Protein Structure Analysis',
  author: 'Dr. Jane Smith',
  includeStructureImage: true,
  includeAnnotations: true,
  includeMetadata: true,
  imageResolution: ImageResolution.FULL_HD,
  pageSize: 'a4',
  orientation: 'landscape',
  margins: {
    top: 72,
    right: 72,
    bottom: 72,
    left: 72
  },
  annotationStyle: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
    borderColor: '#cccccc',
    borderWidth: 1
  }
});
```

### Session State Export

```typescript
// Export session
const result = await exportSession({
  includeCamera: true,
  includeAnnotations: true,
  includeSelection: true,
  includeVisualizationSettings: true,
  includeMetadata: true,
  prettyPrint: true
});

// Save to file
downloadResult(result);

// Access raw data
console.log('Session data:', result.data);

// Later, restore the session
const sessionData = await loadSessionFromFile(file);
await restoreSession(sessionData);
```

## API Routes

### POST /api/export/image

Export image with server-side processing.

**Request:**
```json
{
  "options": {
    "format": "png",
    "resolution": "hd",
    "quality": 95
  },
  "imageData": "data:image/png;base64,..."
}
```

**Response:**
Binary image data with appropriate Content-Type header.

### POST /api/export/model

Export 3D model with server-side conversion.

**Request:**
```json
{
  "options": {
    "format": "gltf",
    "scale": 1.0
  },
  "modelData": {
    "vertices": [...],
    "normals": [...],
    "colors": [...],
    "indices": [...]
  }
}
```

**Response:**
Binary or text model data with appropriate Content-Type header.

### POST /api/export/pdf

Generate PDF document (client-side rendering preferred).

**Request:**
```json
{
  "options": {
    "title": "Export",
    "includeAnnotations": true
  },
  "data": {
    "structureImage": "data:image/png;base64,...",
    "annotations": [...],
    "metadata": {...}
  }
}
```

## Implementing ExportableViewer

To integrate export features with your viewer, implement the `ExportableViewer` interface:

```typescript
import { ExportableViewer } from '@/services/export-service';

class MyMolStarViewer implements ExportableViewer {
  constructor(private plugin: PluginContext) {}

  getCanvas(): HTMLCanvasElement | null {
    return this.plugin.canvas3d?.webgl?.canvas || null;
  }

  getViewportDimensions() {
    const canvas = this.getCanvas();
    return {
      width: canvas?.width || 1920,
      height: canvas?.height || 1080
    };
  }

  getCameraState() {
    const camera = this.plugin.canvas3d?.camera;
    return {
      position: Vec3.toArray(camera.state.position),
      target: Vec3.toArray(camera.state.target),
      zoom: camera.state.radius,
      rotation: [0, 0, 0], // Calculate from camera matrix
      fov: camera.state.fov
    };
  }

  // Implement other methods...
}
```

## Performance Considerations

### Image Export

- **Large resolutions**: 4K exports may take several seconds
- **Watermarks**: Minimal performance impact
- **Quality**: Higher quality = larger file size, minimal performance impact

### 3D Model Export

- **Geometry optimization**: Reduces vertices, may take time for large structures
- **Format complexity**: glTF with textures > OBJ > STL in processing time
- **Scale**: No performance impact, just multiplies coordinates

### PDF Export

- **Annotations**: Each annotation requires layout calculation
- **Images**: High-resolution images increase PDF size significantly
- **Page count**: Multiple pages increase generation time linearly

### Session Export

- **Fast operation**: JSON serialization is very quick
- **File size**: Pretty printing increases size ~30%
- **Annotations**: Large annotation counts increase size linearly

## Testing

Comprehensive test suite in `src/tests/export-service.test.ts`:

```bash
npm test export-service.test.ts
```

**Test Coverage:**
- Image export (all formats and resolutions)
- 3D model export (all formats)
- PDF generation
- Session state export
- Progress reporting
- Error handling
- Singleton pattern

## Browser Compatibility

### Image Export
- ✅ Chrome/Edge (all features)
- ✅ Firefox (all features)
- ✅ Safari (PNG quality limitations)

### 3D Model Export
- ✅ All modern browsers (client-side conversion)

### PDF Export
- ✅ All modern browsers (using jsPDF library)

### File Downloads
- ✅ All modern browsers
- ⚠️ Mobile browsers may have different download behavior

## Dependencies

```json
{
  "dependencies": {
    "jspdf": "^2.5.1"  // PDF generation
  }
}
```

## Future Enhancements

1. **Batch Export**: Export multiple structures at once
2. **Video Export**: Animated rotations and flythrough
3. **Advanced Watermarking**: Logos and custom graphics
4. **Cloud Storage**: Direct upload to cloud services
5. **Export Templates**: Predefined export configurations
6. **Compression**: ZIP archives for multiple files
7. **Format Conversion**: Server-side format conversions
8. **Export History**: Track and manage previous exports

## Troubleshooting

### "Canvas not available for export"
- Ensure viewer is fully initialized before exporting
- Check that MolStar plugin has created the canvas

### "Export failed" with large resolutions
- Try a lower resolution
- Ensure sufficient browser memory
- Check browser console for specific errors

### PDF annotations not appearing
- Verify `includeAnnotations` option is true
- Check that annotations exist in viewer
- Ensure annotation data is properly formatted

### Downloads not working on mobile
- Use explicit download buttons
- Consider server-side downloads for mobile
- Check browser download settings

## Support

For issues or questions:
1. Check this documentation
2. Review test suite for examples
3. Check browser console for errors
4. File an issue on GitHub

## License

Part of LAB Visualizer Platform
