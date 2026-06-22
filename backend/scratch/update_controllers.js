const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/adminRequests.controller.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update getCompanyWorkflows
const oldGetWorkflows = `    const formatted = templates?.map(template => {
      const existing = instances?.find(i => i.workflow_type === template.workflow_type);
      return {
        workflow_type: template.workflow_type,
        display_name: template.display_name,
        status: existing?.status || template.allowed_states[0], // Default to first state if never touched
        allowed_states: template.allowed_states,
        updated_at: existing?.updated_at || new Date().toISOString()
      };
    }) || [];

    res.status(200).json({ success: true, data: formatted });`;

const newGetWorkflows = `    const formatted = templates?.map(template => {
      const existing = instances?.find(i => i.workflow_type === template.workflow_type);
      return {
        workflow_type: template.workflow_type,
        display_name: template.display_name,
        status: existing?.status || template.allowed_states[0], // Default to first state if never touched
        allowed_states: template.allowed_states,
        updated_at: existing?.updated_at || new Date().toISOString()
      };
    }) || [];

    // ADD CUSTOM STAGES
    const customInstances = instances?.filter(i => !templates?.some(t => t.workflow_type === i.workflow_type)) || [];
    const customFormatted = customInstances.map(instance => {
       return {
         workflow_type: instance.workflow_type,
         display_name: instance.workflow_type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
         status: instance.status,
         allowed_states: ['not_started', 'in_progress', 'completed'], // Simple generic states for custom
         updated_at: instance.updated_at || new Date().toISOString()
       };
    });

    const combined = [...formatted, ...customFormatted];

    res.status(200).json({ success: true, data: combined });`;

content = content.replace(oldGetWorkflows, newGetWorkflows);

// 2. Add addCustomWorkflowStage at the bottom of the file
const newFunc = `
export const addCustomWorkflowStage = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { stageName } = req.body;

    if (!stageName) {
      res.status(400).json({ success: false, message: 'stageName is required' });
      return;
    }

    const { data: statusData, error: statusError } = await supabase
      .from('company_status')
      .select('id')
      .eq('company_id', companyId)
      .single();
      
    if (statusError || !statusData) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    const workflowType = stageName.toLowerCase().replace(/\\s+/g, '_');

    const { error: upsertError } = await supabase
      .from('company_workflows')
      .upsert({
        assignment_id: statusData.id,
        workflow_type: workflowType,
        status: 'not_started',
        updated_at: new Date().toISOString()
      }, { onConflict: 'assignment_id, workflow_type' });

    if (upsertError) throw upsertError;

    await appendTimeline({
      companyId,
      assignmentId: statusData.id,
      eventType: 'note_added',
      title: \`Custom Phase Added: \${stageName}\`,
      description: 'A new workflow phase was added.',
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'all_roles'
    });

    res.status(200).json({ success: true, message: 'Custom stage added successfully' });
  } catch (error: any) {
    console.error('addCustomWorkflowStage Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
`;

content += newFunc;

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Backend controllers updated!');
