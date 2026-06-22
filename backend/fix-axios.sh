sed -i "s/const response = await fetch/const response = await require('axios').post/g" src/utils/email.ts
sed -i "s/method: 'POST',//g" src/utils/email.ts
sed -i "s/body: JSON.stringify(/ /g" src/utils/email.ts
sed -i "s/})//g" src/utils/email.ts
