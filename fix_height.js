const fs = require('fs');

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

const searchStr = \`      {/* Main Header */}
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
      </div>\`;

const replaceStr = \`      {/* Main Header */}
      <div className="w-full bg-white py-4 px-4 sm:px-8 relative z-10 border-b-2 border-[#1b4376]">
        <div className="w-full max-w-[95%] xl:max-w-[85%] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4 sm:mr-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-slate-800 text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-[clamp(0.25rem,0.5vw,0.75rem)] shadow-md" style={{ transform: 'translateY(15px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="object-contain w-[clamp(4.5rem,6vw,7rem)] h-[clamp(4.5rem,6vw,7rem)] transition-all duration-300"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-[#1b4376] text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">National Institute of Technology Hamirpur</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>\`;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(searchStr)) {
      content = content.replace(searchStr, replaceStr);
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    } else {
      console.log('Search string not found in ' + file);
    }
  } catch(e) {
    console.error(e);
  }
}
