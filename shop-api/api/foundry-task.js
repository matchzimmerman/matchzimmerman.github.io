var printful=require("../lib/printful");

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  try{
    var storeId=req.query&&req.query.storeId;
    var taskKey=req.query&&req.query.taskKey;
    if(!storeId||!taskKey){
      res.statusCode=400;
      res.setHeader("Content-Type","application/json; charset=utf-8");
      return res.end(JSON.stringify({ok:false,error:"storeId and taskKey are required."},null,2));
    }
    var payload=await printful.getMockupTask(storeId,taskKey);
    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:true,result:payload.result},null,2));
  }catch(error){
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};
