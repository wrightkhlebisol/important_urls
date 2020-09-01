var express     = require('express');
var mongoose    = require('mongoose');
var multer      = require('multer');
var path        = require('path');
var csvModel    = require('./models/csv');
var csv         = require('csvtojson');
var bodyParser  = require('body-parser');

var storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/uploads');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});

var uploads = multer({storage:storage});

//connect to db
mongoose.connect('mongodb://localhost:27017/csvdemos',{useNewUrlParser:true})
.then(()=>console.log('connected to db'))
.catch((err)=>console.log(err))

//init app
var app = express();

//set the template engine
app.set('view engine','ejs');

//fetch data from the request
app.use(bodyParser.urlencoded({extended:false}));

//static folder
app.use(express.static(path.resolve(__dirname,'public')));

//default pageload
app.get('/',(req,res)=>{
    csvModel.find((err,data)=>{
         if(err){
             console.log(err);
         }else{
              if(data!=''){
                  res.render('demo',{data:data});
              }else{
                  res.render('demo',{data:''});
              }
         }
    });
});

var temp ;

app.post('/',uploads.single('csv'),(req,res)=>{
 //convert csvfile to jsonArray
csv()
.fromFile(req.file.path)
.then((jsonObj)=>{
    console.log(jsonObj);
    //the jsonObj will contain all the data in JSONFormat.
    //but we want columns Test1,Test2,Test3,Test4,Final data as number .
    //becuase we set the dataType of these fields as Number in our mongoose.Schema().
    //here we put a for loop and change these column value in number from string using parseFloat().
    //here we use parseFloat() beause because these fields contain the float values.
    for(var x=0;x<jsonObj;x++){
         temp = parseFloat(jsonObj[x].Test1)
         jsonObj[x].Test1 = temp;
         temp = parseFloat(jsonObj[x].Test2)
         jsonObj[x].Test2 = temp;
         temp = parseFloat(jsonObj[x].Test3)
         jsonObj[x].Test3 = temp;
         temp = parseFloat(jsonObj[x].Test4)
         jsonObj[x].Test4 = temp;
         temp = parseFloat(jsonObj[x].Final)
         jsonObj[x].Final = temp;
     }
     //insertmany is used to save bulk data in database.
    //saving the data in collection(table)
     csvModel.insertMany(jsonObj,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                res.redirect('/');
            }
     });
   });
});

//assign port
var port = process.env.PORT || 3000;
app.listen(port,()=>console.log('server run at port '+port));
