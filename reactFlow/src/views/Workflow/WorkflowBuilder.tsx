import React, { useCallback, useState, useEffect, DragEvent } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Tooltip } from 'antd';
import { UndoOutlined, RedoOutlined, HolderOutlined } from '@ant-design/icons';

import TextToTextNode from './nodes/TextToTextNode';
import TextToImageNode from './nodes/TextToImageNode';
import TemplatePanel from './components/TemplatePanel';

const nodeTypes = {
  textToText: TextToTextNode,
  textToImage: TextToImageNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textToText',
    position: { x: 100, y: 100 },
    data: { label: 'Text to Text' },
  },
];

const initialEdges: Edge[] = [];

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const WorkflowFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // History State
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Panel Drag State
  const [panelPos, setPanelPos] = useState({ x: 20, y: 20 });
  const dragRef = React.useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPanelPos({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
    };
    const handleMouseUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const onPanelMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when interacting with controls inside
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.ant-list-item')) return;
    
    dragRef.current = { 
      startX: e.clientX, 
      startY: e.clientY, 
      initX: panelPos.x, 
      initY: panelPos.y 
    };
  };

  const takeSnapshot = useCallback(() => {
    setPast((old) => [...old, { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture((old) => [{ nodes, edges }, ...old]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setPast(newPast);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((old) => [...old, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(newFuture);
  }, [future, nodes, edges, setNodes, setEdges]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((c) => c.type === 'remove' || c.type === 'replace')) {
        takeSnapshot();
      }
      onNodesChange(changes);
    },
    [onNodesChange, takeSnapshot]
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some((c) => c.type === 'remove' || c.type === 'replace')) {
        takeSnapshot();
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, takeSnapshot]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot],
  );

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      takeSnapshot();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `dndnode_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, takeSnapshot],
  );

  const handleAddTemplate = (template: any) => {
    takeSnapshot();
    const idPrefix = `tmpl-${Date.now()}`;
    const offset = { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 };
    
    const newNodes = template.nodes.map((node: Node) => ({
      ...node,
      id: `${idPrefix}-${node.id}`,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      data: { ...node.data },
    }));

    const newEdges = template.edges.map((edge: Edge) => ({
      ...edge,
      id: `${idPrefix}-${edge.id}`,
      source: `${idPrefix}-${edge.source}`,
      target: `${idPrefix}-${edge.target}`,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  };

  return (
    <div className="w-full h-screen relative bg-gray-50 overflow-hidden">
      {/* Draggable Template Panel */}
      <div 
        style={{ 
          position: 'absolute', 
          left: panelPos.x, 
          top: panelPos.y, 
          zIndex: 50,
          height: 'calc(100vh - 40px)'
        }}
        className="shadow-2xl rounded-lg flex flex-col overflow-hidden border border-gray-200 bg-white"
      >
        <div 
          className="h-6 bg-gray-100 cursor-move flex items-center justify-center border-b border-gray-200 hover:bg-gray-200 transition-colors"
          onMouseDown={onPanelMouseDown}
        >
          <HolderOutlined className="text-gray-400" />
        </div>
        <div className="flex-1 overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
           <TemplatePanel onAddTemplate={handleAddTemplate} />
        </div>
      </div>

      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChangeWrapped}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <Panel position="top-right" className="flex gap-2 bg-white p-1 rounded-md shadow-sm border border-gray-200">
            <Tooltip title="Undo (Ctrl+Z)">
              <Button 
                type="text" 
                icon={<UndoOutlined />} 
                onClick={undo} 
                disabled={past.length === 0}
              />
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <Button 
                type="text" 
                icon={<RedoOutlined />} 
                onClick={redo} 
                disabled={future.length === 0}
              />
            </Tooltip>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

const WorkflowBuilder = () => (
  <ReactFlowProvider>
    <WorkflowFlow />
  </ReactFlowProvider>
);

export default WorkflowBuilder;
