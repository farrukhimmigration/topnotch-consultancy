export async function POST() { 
  const code = "STAFF-" + Math.random().toString(36).substring(2, 10).toUpperCase(); 
  return Response.json({ code }); 
} 
