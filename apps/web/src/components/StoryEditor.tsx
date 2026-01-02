import { useState, useEffect } from 'react';
import { X, Save, Loader, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Story, StoryNode, StoryChoice } from '../lib/types';

interface StoryEditorProps {
  storyId: string;
  onClose: () => void;
  onSave: () => void;
}

interface EditableChoice {
  id?: string;
  choice_text: string;
  consequence_hint: string;
  to_node_id: string;
  isNew?: boolean;
}

export function StoryEditor({ storyId, onClose, onSave }: StoryEditorProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedNodes, setEditedNodes] = useState<Record<string, string>>({});
  const [editedChoices, setEditedChoices] = useState<Record<string, EditableChoice[]>>({});
  const [deletedChoiceIds, setDeletedChoiceIds] = useState<string[]>([]);

  useEffect(() => {
    loadStoryData();
  }, [storyId]);

  const loadStoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle();

      if (storyError) throw storyError;
      if (!storyData) {
        setError('Story not found');
        return;
      }

      // Cast JSON fields to proper types
      setStory(storyData as Story);
      setEditedTitle(storyData.title);
      setEditedDescription(storyData.description || '');

      const { data: nodesData, error: nodesError } = await supabase
        .from('story_nodes')
        .select('*')
        .eq('story_id', storyId)
        .order('node_key');

      if (nodesError) throw nodesError;

      setNodes(nodesData || []);

      const initialEditedNodes: Record<string, string> = {};
      nodesData?.forEach(node => {
        initialEditedNodes[node.id] = node.content || '';
      });
      setEditedNodes(initialEditedNodes);

      const { data: choicesData, error: choicesError } = await supabase
        .from('story_choices')
        .select('*')
        .in('from_node_id', nodesData?.map(n => n.id) || []);

      if (choicesError) throw choicesError;

      setChoices(choicesData || []);

      const initialEditedChoices: Record<string, EditableChoice[]> = {};
      nodesData?.forEach(node => {
        const nodeChoices = (choicesData || [])
          .filter(c => c.from_node_id === node.id)
          .map(c => ({
            id: c.id,
            choice_text: c.choice_text,
            consequence_hint: c.consequence_hint || '',
            to_node_id: c.to_node_id,
          }));
        initialEditedChoices[node.id] = nodeChoices;
      });
      setEditedChoices(initialEditedChoices);

    } catch (err) {
      console.error('Error loading story:', err);
      setError('Failed to load story data');
    } finally {
      setLoading(false);
    }
  };

  const addChoice = (nodeId: string) => {
    const currentChoices = editedChoices[nodeId] || [];
    if (currentChoices.length >= 5) {
      alert('Maximum 5 choices per chapter');
      return;
    }

    const availableNodes = nodes.filter(n => n.id !== nodeId);
    if (availableNodes.length === 0) {
      alert('No available nodes to connect to');
      return;
    }

    setEditedChoices(prev => ({
      ...prev,
      [nodeId]: [
        ...(prev[nodeId] || []),
        {
          choice_text: '',
          consequence_hint: '',
          to_node_id: availableNodes[0].id,
          isNew: true,
        }
      ]
    }));
  };

  const updateChoice = (nodeId: string, choiceIndex: number, field: keyof EditableChoice, value: string) => {
    setEditedChoices(prev => ({
      ...prev,
      [nodeId]: (prev[nodeId] || []).map((choice, idx) =>
        idx === choiceIndex ? { ...choice, [field]: value } : choice
      )
    }));
  };

  const deleteChoice = (nodeId: string, choiceIndex: number) => {
    const choice = editedChoices[nodeId]?.[choiceIndex];
    if (choice?.id && !choice.isNew) {
      setDeletedChoiceIds(prev => [...prev, choice.id!]);
    }

    setEditedChoices(prev => ({
      ...prev,
      [nodeId]: (prev[nodeId] || []).filter((_, idx) => idx !== choiceIndex)
    }));
  };

  const handleSave = async () => {
    if (!story) return;

    try {
      setSaving(true);
      setError(null);

      const { error: storyError } = await supabase
        .from('stories')
        .update({
          title: editedTitle,
          description: editedDescription,
        })
        .eq('id', storyId);

      if (storyError) throw storyError;

      for (const node of nodes) {
        const newContent = editedNodes[node.id];
        if (newContent !== node.content) {
          const { error: nodeError } = await supabase
            .from('story_nodes')
            .update({ content: newContent })
            .eq('id', node.id);

          if (nodeError) throw nodeError;
        }
      }

      for (const choiceId of deletedChoiceIds) {
        const { error: deleteError } = await supabase
          .from('story_choices')
          .delete()
          .eq('id', choiceId);

        if (deleteError) throw deleteError;
      }

      for (const nodeId of Object.keys(editedChoices)) {
        const nodeChoices = editedChoices[nodeId];

        for (const choice of nodeChoices) {
          if (!choice.choice_text.trim()) continue;

          if (choice.isNew) {
            const { error: insertError } = await supabase
              .from('story_choices')
              .insert({
                from_node_id: nodeId,
                to_node_id: choice.to_node_id,
                choice_text: choice.choice_text,
                consequence_hint: choice.consequence_hint || null,
              });

            if (insertError) throw insertError;
          } else if (choice.id) {
            const originalChoice = choices.find(c => c.id === choice.id);
            if (originalChoice && (
              originalChoice.choice_text !== choice.choice_text ||
              originalChoice.consequence_hint !== choice.consequence_hint ||
              originalChoice.to_node_id !== choice.to_node_id
            )) {
              const { error: updateError } = await supabase
                .from('story_choices')
                .update({
                  choice_text: choice.choice_text,
                  consequence_hint: choice.consequence_hint || null,
                  to_node_id: choice.to_node_id,
                })
                .eq('id', choice.id);

              if (updateError) throw updateError;
            }
          }
        }
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving story:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col items-center justify-center p-8 gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Edit Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Story Title
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter story title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Enter story description"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Story Chapters</h3>
            <div className="space-y-6">
              {nodes.map((node, index) => (
                <div key={node.id} className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {node.node_key === 'start' ? 'Opening' : `Chapter ${index}`}
                    </label>
                    <textarea
                      value={editedNodes[node.id] || ''}
                      onChange={(e) => setEditedNodes(prev => ({
                        ...prev,
                        [node.id]: e.target.value
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      placeholder="Enter chapter content"
                    />
                    <p className="text-xs text-gray-500 mt-2">Node key: {node.node_key}</p>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Choices ({(editedChoices[node.id] || []).length}/5)
                      </label>
                      <button
                        onClick={() => addChoice(node.id)}
                        disabled={(editedChoices[node.id] || []).length >= 5}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        Add Choice
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editedChoices[node.id] || []).map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={choice.choice_text}
                                onChange={(e) => updateChoice(node.id, choiceIndex, 'choice_text', e.target.value)}
                                placeholder="Choice text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={choice.consequence_hint}
                                onChange={(e) => updateChoice(node.id, choiceIndex, 'consequence_hint', e.target.value)}
                                placeholder="Consequence hint (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <select
                                value={choice.to_node_id}
                                onChange={(e) => updateChoice(node.id, choiceIndex, 'to_node_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {nodes.filter(n => n.id !== node.id).map(targetNode => (
                                  <option key={targetNode.id} value={targetNode.id}>
                                    Go to: {targetNode.node_key}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => deleteChoice(node.id, choiceIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete choice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(editedChoices[node.id] || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No choices yet. Add up to 5 choices for this chapter.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors text-sm sm:text-base"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editedTitle.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
          >
            {saving ? (
              <>
                <Loader className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save...</span>
              </>
            ) : (
              <>
                <Save className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
