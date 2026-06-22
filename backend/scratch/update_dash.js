const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend/src/features/communicationTPR/pages/DashboardPage.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
content = content.replace(
  "import React from 'react';",
  "import React, { useEffect, useState } from 'react';\nimport { requestApi } from '../services/request.api';"
);
content = content.replace(
  "import { MessageSquare, Users, Building2, Bell } from 'lucide-react';",
  "import { MessageSquare, CheckCircle, Clock, Bell } from 'lucide-react';"
);

// 2. Add state and fetch logic
content = content.replace(
  "const { user } = useCommunicationAuth();",
  `const { user } = useCommunicationAuth();
  const [counts, setCounts] = useState({
    active: 0,
    pending_followups: 0, // This could be fetched from followups API if needed, for now 0
    pending_review: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await requestApi.getQueueCounts();
        if (res.success && res.data) {
          setCounts(prev => ({
            ...prev,
            active: res.data.approved || 0,
            pending_review: res.data.pending_review || 0,
            completed: res.data.completed || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching queue counts:', error);
      }
    };
    fetchCounts();
  }, []);`
);

// 3. Update stats array
content = content.replace(
  /const stats = \[[\s\S]*?\];/,
  `const stats = [
    { id: 1, name: 'Active Communications', stat: counts.active.toString(), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 2, name: 'Pending Follow-ups', stat: counts.pending_followups.toString(), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 3, name: 'New Incoming Company', stat: counts.pending_review.toString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 4, name: 'Confirmed Company', stat: counts.completed.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update complete!');
