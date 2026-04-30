import { useRef, useEffect, useState } from "react";
import SignaturePadOriginal from "signature_pad";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onEnd: (dataUrl: string) => void;
}

export function SignaturePad({ onEnd }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadOriginal | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePadOriginal(canvas, {
      penColor: "rgb(255, 255, 255)", // White ink for dark theme
      backgroundColor: "transparent",
    });

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
      onEnd(pad.toDataURL());
    });

    signaturePadRef.current = pad;

    const handleResize = () => {
      const data = pad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.fromData(data);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      pad.off();
    };
  }, [onEnd]);

  const clear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onEnd("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-border/50 bg-card/30 rounded-lg overflow-hidden relative backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground font-mono text-sm opacity-50">
            Sign here
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clear} disabled={isEmpty} className="h-8 text-xs font-mono">
          Clear Signature
        </Button>
      </div>
    </div>
  );
}