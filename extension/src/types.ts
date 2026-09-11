// Duplicated from src/types/guides.ts's GuideAnnotation, deliberately not
// imported -- the extension never calls Gemini and has no reason to couple
// its build to the main app's. ScreenAssistVisionService only ever produces
// 'circle'/'arrow' with x/y/color?/label?, so that's all this covers.
export interface HighlightAnnotation {
  type: 'circle' | 'arrow';
  x: number; // percentage 0-100, of the target page's viewport
  y: number; // percentage 0-100
  color?: string; // hex
  label?: string;
}
