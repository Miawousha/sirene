import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import mermaid from "mermaid";
import { preprocessMermaid } from "@/lib/preprocessor";
import {
  Eye,
  AlertTriangle,
  Workflow,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface PreviewProps {
  code: string;
  theme: "light" | "dark";
  onError: (error: string | null) => void;
}

export interface PreviewHandle {
  getSvg: () => string | null;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;

export const Preview = forwardRef<PreviewHandle, PreviewProps>(
  function Preview({ code, theme, onError }, ref) {
    const [svgHtml, setSvgHtml] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const renderIdRef = useRef(0);

    // Zoom & pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const panOffsetRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getSvg: () => svgHtml || null,
    }));

    // Clean up stale Mermaid DOM artifacts (error SVGs, temp containers)
    const cleanupMermaidDom = useCallback(() => {
      document
        .querySelectorAll('[id^="dmermaid-"], [id^="mermaid-"]')
        .forEach((el) => {
          // Don't remove our own content container
          if (contentRef.current?.contains(el)) return;
          el.remove();
        });
      // Mermaid also appends error elements with data-el-id or class "error-icon"
      document
        .querySelectorAll(".error-icon, .error-text, [data-el-id]")
        .forEach((el) => el.remove());
    }, []);

    // Render diagram
    const renderDiagram = useCallback(
      async (source: string, currentTheme: "light" | "dark") => {
        const renderId = ++renderIdRef.current;
        const trimmed = source.trim();

        if (!trimmed) {
          setSvgHtml("");
          setErrorMsg(null);
          onError(null);
          cleanupMermaidDom();
          return;
        }

        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: currentTheme === "dark" ? "dark" : "default",
            securityLevel: "loose",
            fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
          });

          const id = `mermaid-${renderId}`;
          const preprocessed = preprocessMermaid(trimmed);
          const { svg } = await mermaid.render(id, preprocessed);

          // Clean up temp elements Mermaid leaves behind
          cleanupMermaidDom();

          if (renderId === renderIdRef.current) {
            setSvgHtml(svg);
            setErrorMsg(null);
            onError(null);
          }
        } catch (err: unknown) {
          // Clean up error artifacts Mermaid injects into the DOM
          cleanupMermaidDom();

          if (renderId === renderIdRef.current) {
            const msg =
              err instanceof Error ? err.message : "Failed to render diagram";
            // Strip HTML tags from Mermaid error messages
            const cleanMsg = msg.replace(/<[^>]*>/g, "").trim();
            setErrorMsg(cleanMsg);
            onError(cleanMsg);
          }
        }
      },
      [onError, cleanupMermaidDom]
    );

    // Debounced rendering
    useEffect(() => {
      const timer = setTimeout(() => {
        renderDiagram(code, theme);
      }, 300);
      return () => clearTimeout(timer);
    }, [code, theme, renderDiagram]);

    // Zoom with mouse wheel
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
      },
      []
    );

    // Pan handlers
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
          // Middle-click or Alt+click to pan
          e.preventDefault();
          setIsPanning(true);
          panStartRef.current = { x: e.clientX, y: e.clientY };
          panOffsetRef.current = { ...pan };
        }
      },
      [pan]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({
          x: panOffsetRef.current.x + (e.clientX - panStartRef.current.x),
          y: panOffsetRef.current.y + (e.clientY - panStartRef.current.y),
        });
      },
      [isPanning]
    );

    const handleMouseUp = useCallback(() => {
      setIsPanning(false);
    }, []);

    // Zoom controls
    const zoomIn = useCallback(() => {
      setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
    }, []);

    const zoomOut = useCallback(() => {
      setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
    }, []);

    const resetView = useCallback(() => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }, []);

    const fitToView = useCallback(() => {
      if (!containerRef.current || !contentRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const svgEl = contentRef.current.querySelector("svg");
      if (!svgEl) return;

      const svgWidth = svgEl.getBoundingClientRect().width / zoom;
      const svgHeight = svgEl.getBoundingClientRect().height / zoom;

      if (svgWidth === 0 || svgHeight === 0) return;

      const scaleX = (container.width - 48) / svgWidth;
      const scaleY = (container.height - 48) / svgHeight;
      const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

      setZoom(Math.max(MIN_ZOOM, newZoom));
      setPan({ x: 0, y: 0 });
    }, [zoom]);

    const zoomPercent = Math.round(zoom * 100);

    return (
      <div className="flex h-full flex-col bg-background outline-none" tabIndex={0}>
        {/* Header with zoom controls */}
        <div className="flex h-8 items-center gap-1 border-b bg-muted/50 px-3">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </span>

          <div className="flex-1" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>

            <span className="w-12 text-center text-[11px] tabular-nums text-muted-foreground">
              {zoomPercent}%
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-4" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={fitToView}>
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={resetView}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset zoom (100%)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 overflow-hidden"
          style={{ cursor: isPanning ? "grabbing" : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                theme === "dark"
                  ? "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)"
                  : "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {errorMsg ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Diagram has errors
              </p>
              <code className="max-w-md rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {errorMsg}
              </code>
            </div>
          ) : svgHtml ? (
            <div
              className="flex h-full items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 0.1s ease-out",
              }}
            >
              <div
                ref={contentRef}
                className="[&>svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Workflow className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                Start typing Mermaid syntax to see a preview
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
