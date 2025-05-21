const fs = require("fs");
// Sync...
// fs.writeFileSync('./test.txt','Hey There');

// Async
// fs.writeFile("./text.txt", "hello chela Async", (err)=>{})

// const results = fs.readFileSync("./contacts.txt","utf-8")
// console.log(results);

// fs.readFile("./contacts.txt","utf-8", (err, result) => {
//     if(err){
//         console.log("error",err);
//     }else {
//         console.log(results);
//     }
// })
// blocking...
// console.log("1");
// const result = fs.readFileSync("contacts.txt", "utf-8");
// console.log(result);
// console.log("2");

// non-blocking code 
console.log("1")
fs.readFile("contacts.txt","utf-8",(err,result) => {
    console.log(result);
})
console.log("2");