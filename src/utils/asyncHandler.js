// const asyncHandler=(requestHandler)=>{
//   return (req,res,next)=>{
//     try{
//       await requestHandler(req,res,next)
//     }catch(error){
//       res.status(error.code||500).json({
//         status:failed,
//         message:error.message
//       })
//       next(error)
//     }

// }}

// Higher order Function that takes function as argument and return a function
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

// ye function kewal error ko hi dhhondkr handle krega agar error ni mila to controller response bhej dega

// agar controller async hai to vo hmesha promise hi return krega chahe error aaye ya na aaye  or agar controller async ni hai to vo normal response bhej dega aur promise.resolve use promise me wrap kr dega taki error aaye to catch me jae aur error ni aaye to normal response bhej dega
//return promise ko koi handle ni krta vo bs ek wrapper hota hai controller res.json ke through response bhej dega
export { asyncHandler };
