import React from 'react';
import { Card, Button, List, Typography } from 'antd';
import { PlusOutlined, AppstoreAddOutlined, ThunderboltOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons';
import { Node, Edge } from '@xyflow/react';

interface Template {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

interface TemplatePanelProps {
  onAddTemplate: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: 'text-gen',
    name: 'Text Generation',
    description: 'A simple text generation node',
    nodes: [
      { id: 'n1', type: 'textToText', data: { label: 'Text Generation' }, position: { x: 0, y: 0 } }
    ],
    edges: []
  },
  {
    id: 'text-to-image',
    name: 'Text to Image',
    description: 'Generate text and convert to image',
    nodes: [
      { id: 'n1', type: 'textToText', data: { label: 'Story Generator' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'textToImage', data: { label: 'Illustration' }, position: { x: 450, y: 0 } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', animated: true }
    ]
  },
  {
    id: 'image-gen',
    name: 'Image Generation',
    description: 'Direct text to image node',
    nodes: [
      { id: 'n1', type: 'textToImage', data: { label: 'Image Gen' }, position: { x: 0, y: 0 } }
    ],
    edges: []
  }
];

const availableNodes = [
  { type: 'textToText', label: 'Text to Text', icon: <FileTextOutlined />, description: 'Generate text from text' },
  { type: 'textToImage', label: 'Text to Image', icon: <PictureOutlined />, description: 'Generate image from text' },
];

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onAddTemplate }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
      
      {/* Nodes Section */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
        <ThunderboltOutlined className="text-xl text-blue-500" />
        <span className="font-semibold text-lg text-gray-800">Nodes</span>
      </div>
      <div className="p-4 grid grid-cols-1 gap-2">
        {availableNodes.map((node) => (
          <div
            key={node.type}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-md transition-all hover:border-blue-300"
            onDragStart={(event) => onDragStart(event, node.type)}
            draggable
          >
             <div className="bg-blue-50 p-2 rounded-lg text-blue-500 flex items-center justify-center">
              {node.icon}
             </div>
             <div className="flex flex-col">
               <span className="font-medium text-gray-800 text-sm">{node.label}</span>
               <span className="text-xs text-gray-500">{node.description}</span>
             </div>
          </div>
        ))}
      </div>

      {/* Templates Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50 mt-2">
           <AppstoreAddOutlined className="text-xl text-blue-500"/>
           <span className="font-semibold text-lg text-gray-800">Templates</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <List
              grid={{ gutter: 16, column: 1 }}
              dataSource={templates}
              renderItem={item => (
                  <List.Item>
                      <Card 
                          hoverable
                          className="w-full shadow-sm hover:shadow-md transition-all border-gray-200"
                          styles={{ body: { padding: '12px' } }}
                      >
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-500">
                                      {item.nodes.some(n => n.type === 'textToImage') ? <PictureOutlined /> : <ThunderboltOutlined />}
                                  </div>
                                  <span className="font-medium text-gray-800">{item.name}</span>
                              </div>
                          </div>
                          
                          <Typography.Paragraph type="secondary" className="text-xs mb-3 text-gray-500" ellipsis={{ rows: 2 }}>
                              {item.description}
                          </Typography.Paragraph>

                          <Button 
                              type="primary" 
                              ghost 
                              size="small" 
                              block
                              icon={<PlusOutlined />} 
                              onClick={() => onAddTemplate(item)}
                          >
                              Add to Workflow
                          </Button>
                      </Card>
                  </List.Item>
              )}
          />
      </div>
    </div>
  );
};

export default TemplatePanel;
