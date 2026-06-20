import { supabase } from './src/config/supabase';

async function main() {
  console.log("Testing insert_company_safe RPC...");
  const { data, error } = await supabase.rpc('insert_company_safe', {
    p_company_name: "Test Company Name " + Date.now(),
    p_branch_id: "e5797f26-d62f-410a-81a1-8d264f331f4a", // Just some UUID, will it fail FK? Yes, needs a valid branch.
    p_hr_name: "Test HR",
    p_email: "test@example.com",
    p_phone_number: "1234567890",
    p_description: "Test description",
    p_data: {}
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success:", data);
  }
}

// First fetch a valid branch ID to use
async function getBranchAndTest() {
  const { data: branches } = await supabase.from('branches').select('id').limit(1);
  if (branches && branches.length > 0) {
    const branchId = branches[0].id;
    console.log("Using Branch ID:", branchId);
    
    // First insert to test success
    const companyName = "Duplicate Test " + Date.now();
    console.log("Inserting first time...");
    const { data: d1, error: e1 } = await supabase.rpc('insert_company_safe', {
      p_company_name: companyName,
      p_branch_id: branchId,
      p_hr_name: "Test", p_email: "test@test.com", p_phone_number: "", p_description: "", p_data: {}
    });
    console.log("First insert result:", e1 || "Success");

    // Second insert to test duplicate handling
    console.log("Inserting second time (should return duplicate)...");
    const { data: d2, error: e2 } = await supabase.rpc('insert_company_safe', {
      p_company_name: companyName,
      p_branch_id: branchId,
      p_hr_name: "Test2", p_email: "test2@test.com", p_phone_number: "", p_description: "", p_data: {}
    });
    console.log("Second insert result:", e2 || "Success, is_duplicate: " + d2?.is_duplicate);
  } else {
    console.error("No branches found");
  }
}

getBranchAndTest();
