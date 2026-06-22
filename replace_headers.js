const fs = require('fs');
const path = require('path');

const targetStr = `{/* Main Header */}
      <div className="w-full bg-white py-4 px-4 sm:px-8 relative z-10 border-b-2 border-[#1b4376]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4">
             <h1 className="text-xl sm:text-2xl font-bold text-slate-800">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="text-sm font-semibold text-slate-600">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-2" style={{ transform: 'translateY(15px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-4">
             <h1 className="text-xl sm:text-2xl font-bold text-[#1b4376]">National Institute of Technology Hamirpur</h1>
             <p className="text-sm font-semibold text-slate-600">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>`;

const targetStrAlt = `{/* Main Header */}
      <div className="w-full bg-white py-4 px-4 sm:px-8 relative z-10 border-b-2 border-[#1b4376]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4">
             <h1 className="text-xl sm:text-2xl font-bold text-slate-800">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="text-sm font-semibold text-slate-600">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-2" style={{ transform: 'translateY(15px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-4">
             <h1 className="text-xl sm:text-2xl font-bold text-[#1b4376]">National Institute of Technology Hamirpur</h1>
             <p className="text-sm font-semibold text-slate-600">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>`;

// They look identical but sometimes whitespace differs. I will just do a regex replace.

const regex = /\{\/\*\s*Main Header\s*\*\/\}[\s\S]*?(?=\{\/\*\s*(Reset Password Section|Login Section|Full Page Loading Overlay|Main Content|Register Section|Forgot Password Section|Registration Section|Request Access Section|Recovery Section)\s*\*\/\}|<!--)/i;

const replacement = `{/* Main Header */}
      <div className="w-full bg-white py-[clamp(1rem,2vw,2rem)] px-4 relative z-10 border-b-2 border-[#1b4376]">
        <div className="w-[95%] lg:w-[80%] max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4 sm:mr-[clamp(1rem,2vw,3rem)]">
             <h1 className="font-bold text-slate-800 text-[clamp(1.25rem,1.8vw,2.5rem)] leading-tight tracking-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.75rem,0.9vw,1.1rem)] mt-1">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-[clamp(0.5rem,1vw,1rem)] shadow-sm" style={{ transform: 'translateY(20px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="object-contain w-[clamp(5.5rem,8vw,10rem)] h-[clamp(5.5rem,8vw,10rem)] transition-all duration-300"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-[clamp(1rem,2vw,3rem)]">
             <h1 className="font-bold text-[#1b4376] text-[clamp(1.25rem,1.8vw,2.5rem)] leading-tight tracking-tight">National Institute of Technology Hamirpur</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.75rem,0.9vw,1.1rem)] mt-1">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>\n\n      `;

const files = [
  '/home/rahul-yadav/Documents/JobFinder/frontend/src/app/register/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend/src/app/reset-password/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend/src/app/login/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend/src/app/forgot-password/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend1/src/app/(portal)/login/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend1/src/app/(portal)/reset-password/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend1/src/app/(portal)/forgot-password/page.tsx',
  '/home/rahul-yadav/Documents/JobFinder/frontend1/src/app/(portal)/request-access/page.tsx'
];

let replacedCount = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Custom replace logic to accurately target the block
    const startIndex = content.indexOf('{/* Main Header */}');
    if (startIndex !== -1) {
      let endIndex = content.indexOf('{/* Full Page Loading Overlay */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Login Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Register Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Forgot Password Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Registration Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Request Access Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Reset Password Section */}', startIndex);
      if (endIndex === -1) endIndex = content.indexOf('{/* Recovery Section */}', startIndex);

      if (endIndex !== -1) {
        content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
        fs.writeFileSync(file, content);
        replacedCount++;
        console.log(\`Successfully updated \${file}\`);
      } else {
        console.log(\`Could not find end marker in \${file}\`);
      }
    } else {
      console.log(\`Could not find start marker in \${file}\`);
    }
  } catch (err) {
    console.error(\`Failed on \${file}:\`, err.message);
  }
}

console.log(\`Total replaced: \${replacedCount}\`);
