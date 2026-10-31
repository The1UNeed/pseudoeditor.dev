'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './FlowchartNodes';
import { FlowchartRunControls } from './FlowchartRunControls';
import { buildFlowchartRunSteps } from './runSteps';
import type { RunTrace } from '@/app/hooks/useWorkspaceSession';
import {
  buildFlowchartFromPseudocode,
  FLOWCHART_PALETTE_ITEMS,
  createFlowchartEdge,
  createFlowchartNodeData,
  generatePseudocodeFromFlowchart,
  getDecisionEdgeLabel,
  getNodePrimaryText,
  getProcessStatements,
  inferIndentUnit,
  parsePalettePayload,
  bridgeEdgesAroundDeletedNodes,
  serializePaletteItem,
} from './model';
import { FlowchartNodeData, FlowchartNodeType, NODE_DIMENSIONS, NODE_TYPE_CONFIG } from './types';
import { useDictionary } from "@/i18n/context";
import {
  Download,
  Layout,
  Plus,
  Trash2,
} from 'lucide-react';

// Shape preview components for palette
function ShapePreview({ type, color }: { type: FlowchartNodeType; color: string }) {
  switch (type) {
    case 'terminator':
      return (
        <div
          className="h-6 w-10 rounded-lg border-2"
          style={{ borderColor: color, background: 'transparent' }}
        />
      );
    case 'process':
      return (
        <div
          className="h-7 w-9 rounded-sm border-2"
          style={{ borderColor: color, background: 'transparent' }}
        />
      );
    case 'decision':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28">
          <polygon
            points="14,2 26,14 14,26 2,14"
            fill="transparent"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'inputOutput':
      return (
        <svg width="28" height="20" viewBox="0 0 28 20">
          <polygon
            points="6,1 27,1 22,19 1,19"
            fill="transparent"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'subroutine':
      return (
        <div className="relative h-6 w-10">
          <div
            className="absolute inset-0 rounded-sm border-2"
            style={{ borderColor: color, background: 'transparent' }}
          />
          <div
            className="absolute left-0.5 top-0.5 bottom-0.5 w-0.5"
            style={{ background: color }}
          />
          <div
            className="absolute right-0.5 top-0.5 bottom-0.5 w-0.5"
            style={{ background: color }}
          />
        </div>
      );
    default:
      return null;
  }
}

interface FlowchartEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  source?: string;
  /** False while the editor stays mounted off-screen; the view is refitted when it slides back in. */
  isVisible?: boolean;
  syntaxId?: string;
  /** The last finished run of this file, replayed block by block on the chart. */
  runTrace?: RunTrace | null;
  onCodeChange?: (code: string) => void;
  onGenerateCode?: (code: string) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

function FlowchartEditorInner({
  initialNodes = [],
  initialEdges = [],
  source,
  isVisible = true,
  syntaxId,
  runTrace = null,
  onCodeChange,
  onGenerateCode,
  onSave,
}: FlowchartEditorProps) {
  const t = useDictionary().editor;
  const paletteText = (item: { id: string; title: string; description: string }) =>
    t.flowchart.palette[item.id as keyof typeof t.flowchart.palette] ?? item;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showPalette, setShowPalette] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const hasInitializedCodeSyncRef = useRef(false);
  const isHydratingFromSourceRef = useRef(false);
  const lastPublishedCodeRef = useRef<string>('');
  const nodesRef = useRef<Node[]>(initialNodes);
  const edgesRef = useRef<Edge[]>(initialEdges);
  const { screenToFlowPosition, fitView, deleteElements, getNode, getViewport, setCenter } = useReactFlow();
  // Blocks added on the canvas are written in the file's syntax and indentation.
  const indentUnit = useMemo(() => inferIndentUnit(source ?? ''), [source]);
  const codeStyle = useMemo(() => ({ syntaxId, indentUnit }), [indentUnit, syntaxId]);
  // Read through a ref so a syntax change alone never publishes: the flowchart stays mounted while
  // hidden, and the page writes published code into whichever file is open.
  const codeStyleRef = useRef(codeStyle);
  useEffect(() => {
    codeStyleRef.current = codeStyle;
  }, [codeStyle]);

  // ── Replaying the last run ──
  const [runIndex, setRunIndex] = useState(0);
  const [runPlaying, setRunPlaying] = useState(false);
  const [runSpeed, setRunSpeed] = useState(1);
  const [closedRunId, setClosedRunId] = useState<number | null>(null);
  const activeRun = runTrace && runTrace.id !== closedRunId ? runTrace : null;
  // Recomputed as the chart changes, so an edit that changes the code retires the replay.
  const runSteps = useMemo(
    () => (activeRun ? buildFlowchartRunSteps(nodes, edges, codeStyle, activeRun) : null),
    [activeRun, codeStyle, edges, nodes],
  );
  const runStepCount = runSteps?.length ?? 0;
  const currentRunIndex = Math.min(runIndex, Math.max(0, runStepCount - 1));

  // A new run replays from its first step.
  const [startedRunId, setStartedRunId] = useState<number | null>(null);
  if (runTrace && runTrace.id !== startedRunId) {
    setStartedRunId(runTrace.id);
    setRunIndex(0);
    setRunPlaying(true);
  }
  const isRunPlaying = runPlaying && currentRunIndex < runStepCount - 1;

  useEffect(() => {
    if (!isRunPlaying || !isVisible) return;
    const timer = window.setTimeout(() => {
      const nextIndex = currentRunIndex + 1;
      setRunIndex(nextIndex);
      if (nextIndex >= runStepCount - 1) setRunPlaying(false);
    }, 700 / runSpeed);
    return () => window.clearTimeout(timer);
  }, [currentRunIndex, isRunPlaying, isVisible, runSpeed, runStepCount]);

  const runView = useMemo(() => {
    if (!activeRun || !runSteps || runSteps.length === 0) return null;
    const passed = runSteps.slice(0, currentRunIndex + 1);
    return {
      step: runSteps[currentRunIndex],
      next: runSteps[currentRunIndex + 1],
      seenNodeIds: new Set(passed.map((step) => step.nodeId)),
      seenEdgeIds: new Set(passed.flatMap((step) => step.edgeIds)),
      stopped: !activeRun.completed && !activeRun.truncated && currentRunIndex === runSteps.length - 1,
    };
  }, [activeRun, currentRunIndex, runSteps]);

  const displayNodes = useMemo(() => {
    if (!runView) return nodes;
    return nodes.map((node) => ({
      ...node,
      className:
        node.id === runView.step.nodeId
          ? runView.stopped
            ? 'flowchart-run-error'
            : 'flowchart-run-current'
          : runView.seenNodeIds.has(node.id)
            ? 'flowchart-run-seen'
            : 'flowchart-run-pending',
    }));
  }, [nodes, runView]);

  const displayEdges = useMemo(() => {
    if (!runView) return edges;
    const currentEdgeIds = new Set(runView.step.edgeIds);
    return edges.map((edge) => ({
      ...edge,
      className: currentEdgeIds.has(edge.id)
        ? 'flowchart-run-edge-current'
        : runView.seenEdgeIds.has(edge.id)
          ? 'flowchart-run-edge-seen'
          : 'flowchart-run-edge-pending',
    }));
  }, [edges, runView]);

  const runDescription = useMemo(() => {
    if (!runView) return '';
    const data = nodes.find((node) => node.id === runView.step.nodeId)?.data as FlowchartNodeData | undefined;
    if (!data) return '';
    if (data.type === 'decision') {
      const taken = edges.find((edge) => edge.source === runView.step.nodeId && runView.next?.edgeIds[0] === edge.id);
      const answer = taken?.sourceHandle === 'true' ? data.trueLabel || 'Yes' : taken?.sourceHandle === 'false' ? data.falseLabel || 'No' : null;
      return `${getNodePrimaryText(data)}${answer ? ` → ${answer}` : ''}`;
    }
    if (data.type === 'process') return getProcessStatements(data).join('  ·  ');
    if (data.type === 'inputOutput') return `${data.ioType === 'input' ? t.flowchart.input : t.flowchart.output} ${getNodePrimaryText(data)}`;
    return getNodePrimaryText(data);
  }, [edges, nodes, runView, t.flowchart.input, t.flowchart.output]);

  // Keep the lit block on screen as the replay moves through a chart bigger than the view.
  const currentRunNodeId = runView?.step.nodeId;
  useEffect(() => {
    if (!currentRunNodeId || !isVisible) return;
    const node = getNode(currentRunNodeId);
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!node || !bounds) return;
    const { x, y, zoom } = getViewport();
    const width = node.measured?.width ?? 200;
    const height = node.measured?.height ?? 100;
    const left = node.position.x * zoom + x;
    const top = node.position.y * zoom + y;
    const margin = 40;
    if (left < margin || top < margin + 72 || left + width * zoom > bounds.width - margin || top + height * zoom > bounds.height - margin) {
      void setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom, duration: 300 });
    }
  }, [currentRunNodeId, getNode, getViewport, isVisible, setCenter]);

  useEffect(() => {
    if (!isVisible) return;
    // Source updates arrive while hidden only once the panel is shown, so fit after they render.
    const frame = requestAnimationFrame(() => {
      void fitView();
    });
    return () => cancelAnimationFrame(frame);
  }, [fitView, isVisible]);

  const selectedNode = useMemo(() => nodes.find((node) => node.selected) ?? null, [nodes]);
  const selectedNodeData = selectedNode ? (selectedNode.data as FlowchartNodeData) : null;

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [edges, nodes]);

  useEffect(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [edges, nodes, onSave]);

  useEffect(() => {
    if (typeof source !== 'string') {
      return;
    }

    const nextSource = source.replace(/\r\n/g, '\n').trim();
    const style = { syntaxId, indentUnit: inferIndentUnit(source) };
    const currentCode = generatePseudocodeFromFlowchart(nodesRef.current, edgesRef.current, style)
      .replace(/\r\n/g, '\n')
      .trim();

    if (nextSource === currentCode) {
      lastPublishedCodeRef.current = currentCode;
      return;
    }

    let imported: ReturnType<typeof buildFlowchartFromPseudocode>;
    try {
      imported = buildFlowchartFromPseudocode(source, syntaxId);
    } catch (error) {
      console.warn("Flowchart import failed.", error);
      return;
    }
    const importedCode = generatePseudocodeFromFlowchart(imported.nodes, imported.edges, style)
      .replace(/\r\n/g, '\n')
      .trim();

    isHydratingFromSourceRef.current = true;
    lastPublishedCodeRef.current = importedCode;
    setNodes(imported.nodes);
    setEdges(imported.edges);
  }, [setEdges, setNodes, source, syntaxId]);

  useEffect(() => {
    const code = generatePseudocodeFromFlowchart(nodes, edges, codeStyleRef.current);
    if (!hasInitializedCodeSyncRef.current) {
      hasInitializedCodeSyncRef.current = true;
      lastPublishedCodeRef.current = code;
      return;
    }

    if (isHydratingFromSourceRef.current) {
      isHydratingFromSourceRef.current = false;
      lastPublishedCodeRef.current = code;
      return;
    }

    if (code === lastPublishedCodeRef.current) {
      return;
    }

    lastPublishedCodeRef.current = code;
    onCodeChange?.(code);
  }, [edges, nodes, onCodeChange]);

  const syncDecisionEdges = useCallback(
    (nodeId: string, nextData: FlowchartNodeData) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.source !== nodeId) {
            return edge;
          }

          if (edge.sourceHandle === 'true') {
            return { ...edge, label: nextData.trueLabel || 'Yes' };
          }

          if (edge.sourceHandle === 'false') {
            return { ...edge, label: nextData.falseLabel || 'No' };
          }

          return edge;
        }),
      );
    },
    [setEdges],
  );

  const updateSelectedNodeData = useCallback(
    (updates: Partial<FlowchartNodeData>) => {
      if (!selectedNode || !selectedNodeData) {
        return;
      }

      const nextData: FlowchartNodeData = {
        ...selectedNodeData,
        ...updates,
      };
      if (updates.ioType && updates.ioType !== selectedNodeData.ioType) {
        // The kept source text belongs to the old mode, so the new mode uses the syntax's own keyword.
        delete nextData.sourceForm;
      }

      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: nextData,
              }
            : node,
        ),
      );

      if (
        nextData.type === 'decision' &&
        (Object.prototype.hasOwnProperty.call(updates, 'trueLabel') ||
          Object.prototype.hasOwnProperty.call(updates, 'falseLabel'))
      ) {
        syncDecisionEdges(selectedNode.id, nextData);
      }
    },
    [selectedNode, selectedNodeData, setNodes, syncDecisionEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const sourceData = sourceNode ? (sourceNode.data as FlowchartNodeData) : null;
      const branchLabel = sourceData ? getDecisionEdgeLabel(connection, sourceData) : undefined;

      // Each exit leads to one next step, so a new connection replaces the one already on that handle.
      setEdges((currentEdges) =>
        addEdge(
          createFlowchartEdge(
            `edge-${connection.source}-${connection.sourceHandle ?? 'next'}-${connection.target}-${Date.now()}`,
            connection.source,
            connection.target,
            { sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle, label: branchLabel },
          ),
          currentEdges.filter(
            (edge) =>
              edge.source !== connection.source ||
              (edge.sourceHandle ?? null) !== (connection.sourceHandle ?? null),
          ),
        ),
      );
    },
    [nodes, setEdges],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      // React Flow drops the deleted blocks' edges before this runs, so the bridges come from the
      // edges of the last render.
      const bridges = bridgeEdgesAroundDeletedNodes(deletedNodes, edgesRef.current);
      if (bridges.length === 0) {
        return;
      }
      setEdges((currentEdges) => [
        ...currentEdges,
        ...bridges.filter(
          (bridge) =>
            !currentEdges.some(
              (edge) =>
                edge.source === bridge.source &&
                (edge.sourceHandle ?? null) === (bridge.sourceHandle ?? null),
            ),
        ),
      ]);
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const payload = parsePalettePayload(event.dataTransfer.getData('application/reactflow'));
      if (!payload) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const dimensions = NODE_DIMENSIONS[payload.type];
      const newNode: Node = {
        id: `${payload.type}-${Date.now()}`,
        type: payload.type,
        position: {
          x: position.x - dimensions.width / 2,
          y: position.y - dimensions.height / 2,
        },
        data: createFlowchartNodeData(payload.type, payload.defaults),
      };

      setNodes((currentNodes) => currentNodes.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragStart = (event: React.DragEvent, payload: string) => {
    event.dataTransfer.setData('application/reactflow', payload);
    event.dataTransfer.effectAllowed = 'move';
  };

  const generatePseudocode = useCallback(() => {
    const code = generatePseudocodeFromFlowchart(nodes, edges, codeStyle);
    lastPublishedCodeRef.current = code;

    if (onGenerateCode) {
      onGenerateCode(code);
    }

    return code;
  }, [codeStyle, edges, nodes, onGenerateCode]);

  const deleteSelected = useCallback(() => {
    // deleteElements runs onNodesDelete, so the blocks around a deleted one stay connected.
    void deleteElements({
      nodes: nodes.filter((node) => node.selected),
      edges: edges.filter((edge) => edge.selected),
    });
  }, [deleteElements, edges, nodes]);

  useEffect(() => {
    if (!confirmingClear) return;
    const timer = window.setTimeout(() => setConfirmingClear(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmingClear]);

  // The canvas is the file's code, so clearing it takes a second click.
  const clearCanvas = useCallback(() => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setConfirmingClear(false);
    setNodes([]);
    setEdges([]);
  }, [confirmingClear, setEdges, setNodes]);

  const processStatements = useMemo(() => {
    if (!selectedNodeData || selectedNodeData.type !== 'process') {
      return [];
    }

    return Array.isArray(selectedNodeData.statements) ? selectedNodeData.statements : [];
  }, [selectedNodeData]);

  const updateProcessStatement = useCallback(
    (index: number, value: string) => {
      if (!selectedNodeData || selectedNodeData.type !== 'process') {
        return;
      }

      const nextStatements = [...processStatements];
      nextStatements[index] = value;
      updateSelectedNodeData({ statements: nextStatements });
    },
    [processStatements, selectedNodeData, updateSelectedNodeData],
  );

  const addProcessStatement = useCallback(() => {
    if (!selectedNodeData || selectedNodeData.type !== 'process') {
      return;
    }

    updateSelectedNodeData({ statements: [...processStatements, ''] });
  }, [processStatements, selectedNodeData, updateSelectedNodeData]);

  const removeProcessStatement = useCallback(
    (index: number) => {
      if (!selectedNodeData || selectedNodeData.type !== 'process') {
        return;
      }

      const nextStatements = processStatements.filter((_, statementIndex) => statementIndex !== index);
      updateSelectedNodeData({ statements: nextStatements.length > 0 ? nextStatements : [''] });
    },
    [processStatements, selectedNodeData, updateSelectedNodeData],
  );

  return (
    <div className="flex h-full w-full">
      <div
        className={`
          flex flex-col border-r border-[var(--separator)] bg-[var(--sidebar)]
          transition-all duration-300 ease-in-out
          ${showPalette ? 'w-64' : 'w-0 overflow-hidden'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[var(--separator)] p-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">{t.flowchart.blocks}</h3>
            <p className="mt-0.5 text-xs text-[var(--text2)]">{t.flowchart.dragOntoFlow}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {FLOWCHART_PALETTE_ITEMS.map((item) => {
            const config = NODE_TYPE_CONFIG[item.type];

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => onDragStart(event, serializePaletteItem(item))}
                className="
                  flex items-center gap-3 rounded-lg border border-[var(--separator)] bg-[var(--surface)] p-3
                  cursor-move transition-all duration-200 group
                  hover:border-[var(--accent)] hover:bg-[var(--surface2)]
                "
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${config.color}20` }}
                >
                  <ShapePreview type={item.type} color={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{paletteText(item).title}</p>
                  <p className="text-xs text-[var(--text2)]">{paletteText(item).description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[var(--separator)] p-3 space-y-2">
          <button
            onClick={generatePseudocode}
            className="
              flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5
              bg-[var(--accent)] text-sm font-medium text-white transition-opacity hover:opacity-90
            "
          >
            <Download className="h-4 w-4" />
            {t.flowchart.generateCode}
          </button>

          <button
            onClick={clearCanvas}
            className="
              flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2
              bg-[var(--surface)] text-sm text-[var(--text2)] transition-colors
              hover:bg-red-500/10 hover:text-red-400
            "
          >
            <Trash2 className="h-4 w-4" />
            {confirmingClear ? t.flowchart.confirmClearCanvas : t.flowchart.clearCanvas}
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowPalette((current) => !current)}
        className={`
          absolute left-0 top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg
          border border-l-0 border-[var(--separator)] bg-[var(--sidebar)] text-[var(--text2)]
          transition-all duration-300 hover:text-[var(--text)]
          ${showPalette ? 'translate-x-64' : 'translate-x-0'}
        `}
        title={showPalette ? t.flowchart.hidePalette : t.flowchart.showPalette}
      >
        <Layout className="h-3 w-3" />
      </button>

      <div className="relative flex-1" ref={reactFlowWrapper}>
        {activeRun ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
            <FlowchartRunControls
              stepCount={runSteps ? runStepCount : null}
              index={currentRunIndex}
              playing={isRunPlaying}
              speed={runSpeed}
              description={runDescription}
              lastOutput={runView && runView.step.output > 0 ? (activeRun.output[runView.step.output - 1] ?? '') : null}
              stopped={Boolean(runView?.stopped)}
              truncatedAt={activeRun.truncated ? activeRun.steps.length : null}
              onIndexChange={(index) => {
                setRunPlaying(false);
                setRunIndex(Math.max(0, Math.min(index, runStepCount - 1)));
              }}
              onPlayingChange={setRunPlaying}
              onSpeedChange={setRunSpeed}
              onClose={() => {
                setRunPlaying(false);
                setClosedRunId(activeRun.id);
              }}
            />
          </div>
        ) : null}

        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          // Long programs need to zoom well out for Fit View to show the whole flow.
          minZoom={0.1}
          attributionPosition="bottom-right"
          deleteKeyCode={['Backspace', 'Delete']}
          className="flowchart-canvas bg-[var(--bg)]"
        >
          <Background gap={20} size={1} color="var(--separator)" className="opacity-20" />

          <Controls className="flowchart-controls" />

          <MiniMap
            className="flowchart-minimap"
            nodeColor={(node) => {
              const data = node.data as FlowchartNodeData;
              return NODE_TYPE_CONFIG[data.type]?.color || 'var(--text3)';
            }}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      <aside className="flex w-80 shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--sidebar)]">
        <div className="border-b border-[var(--separator)] p-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">{t.flowchart.inspector}</h3>
          <p className="mt-0.5 text-xs text-[var(--text2)]">
            {selectedNodeData
              ? t.flowchart.inspectorSelected
              : t.flowchart.inspectorEmpty}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedNodeData && selectedNode ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--separator)] bg-[var(--surface)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text3)]">
                  {t.flowchart.selected}
                </p>
                <h4 className="mt-2 text-base font-semibold text-[var(--text)]">
                  {t.flowchart.nodeTypes[selectedNodeData.type].label}
                </h4>
                <p className="mt-2 text-xs leading-5 text-[var(--text2)]">
                  {t.flowchart.nodeTypes[selectedNodeData.type].description}
                </p>
              </div>

              {selectedNodeData.type === 'terminator' ? (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                    {selectedNodeData.routine ? t.flowchart.routineHeader : t.flowchart.label}
                  </span>
                  <input
                    value={selectedNodeData.label}
                    onChange={(event) => updateSelectedNodeData({ label: event.target.value })}
                    className="w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                    placeholder={t.flowchart.palette.start.title}
                  />
                </label>
              ) : null}

              {selectedNodeData.type === 'inputOutput' ? (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                      {t.flowchart.mode}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['input', 'output'] as const).map((mode) => {
                        const active = selectedNodeData.ioType === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              updateSelectedNodeData({
                                ioType: mode,
                                label: mode === 'input' ? 'Input' : 'Output',
                              })
                            }
                            className={`
                              rounded-lg border px-3 py-2 text-sm font-medium transition
                              ${
                                active
                                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                  : 'border-[var(--separator)] bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text)]'
                              }
                            `}
                          >
                            {mode === 'input' ? t.flowchart.input : t.flowchart.output}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                      {selectedNodeData.ioType === 'input' ? t.flowchart.variable : t.flowchart.valueExpression}
                    </span>
                    <textarea
                      value={typeof selectedNodeData.content === 'string' ? selectedNodeData.content : ''}
                      onChange={(event) => updateSelectedNodeData({ content: event.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      placeholder={selectedNodeData.ioType === 'input' ? 'UserName' : '"Hello world"'}
                    />
                  </label>
                </>
              ) : null}

              {selectedNodeData.type === 'process' ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                      {t.flowchart.blockTitle}
                    </span>
                    <input
                      value={selectedNodeData.label}
                      onChange={(event) => updateSelectedNodeData({ label: event.target.value })}
                      className="w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      placeholder={t.flowchart.process}
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                        {t.flowchart.blockLines}
                      </span>
                      <button
                        type="button"
                        onClick={addProcessStatement}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text2)] transition hover:text-[var(--text)]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t.flowchart.addLine}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {processStatements.map((statement, index) => (
                        <div
                          key={`statement-${index}`}
                          className="rounded-xl border border-[var(--separator)] bg-[var(--surface)] p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text3)]">
                              {t.flowchart.line(index + 1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeProcessStatement(index)}
                              className="rounded-lg p-1 text-[var(--text3)] transition hover:bg-red-500/10 hover:text-red-400"
                              aria-label={t.flowchart.removeLine(index + 1)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={statement}
                            onChange={(event) => updateProcessStatement(index, event.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                            placeholder="Total <- Total + Value"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedNodeData.type === 'decision' ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                      {selectedNodeData.controlKind === 'repeat' ? t.flowchart.until : t.flowchart.condition}
                    </span>
                    <textarea
                      value={typeof selectedNodeData.content === 'string' ? selectedNodeData.content : ''}
                      onChange={(event) => updateSelectedNodeData({ content: event.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      placeholder="Score >= 50"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                        {t.flowchart.sideBranch}
                      </span>
                      <input
                        value={selectedNodeData.trueLabel ?? 'Yes'}
                        onChange={(event) => updateSelectedNodeData({ trueLabel: event.target.value })}
                        className="w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                        {t.flowchart.downBranch}
                      </span>
                      <input
                        value={selectedNodeData.falseLabel ?? 'No'}
                        onChange={(event) => updateSelectedNodeData({ falseLabel: event.target.value })}
                        className="w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {selectedNodeData.type === 'subroutine' ? (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                    {t.flowchart.callTarget}
                  </span>
                  <input
                    value={typeof selectedNodeData.content === 'string' ? selectedNodeData.content : ''}
                    onChange={(event) => updateSelectedNodeData({ content: event.target.value })}
                    className="w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                    placeholder="ProcedureName()"
                  />
                </label>
              ) : null}

              <button
                type="button"
                onClick={deleteSelected}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text2)] transition hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t.flowchart.deleteSelected}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--separator)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">{t.flowchart.buildLikeBlocks}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
                  {t.flowchart.helpIo}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
                  {t.flowchart.helpProcess}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
                  {t.flowchart.helpRun}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function FlowchartEditor(props: FlowchartEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowchartEditorInner {...props} />
    </ReactFlowProvider>
  );
}
