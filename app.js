const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express()

//app uses ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))

//database hosted in the cloud via Atlas
mongoose.connect("mongodb+srv://sjnwogu:TbPk9taIkabKLf7V@cluster0.21kapig.mongodb.net/todolistDB")

//create item schema
const itemSchema = new mongoose.Schema({
    name: String
})

//compile schema into model
const Item = mongoose.model("Item",itemSchema)

//construct default item documents
const item1 = new Item({
    name:"Welcome to your todolist"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3]

//schema for the different to do lists
const listSchema = {
    name: String,
    items: [itemSchema] //array of item schema based items
}

const List = mongoose.model("List", listSchema)

app.get("/",async (req,res) => {
    //find all items in DB
    await Item.find({})
        .then((foundItems) => { //find promise is resolved
            if(foundItems.length === 0){
                //insert default items into database
                Item.insertMany(defaultItems)
                    .then(() =>{
                        console.log("Successfully saved default items into DB")
                    })
                    .catch(() => {
                        console.log("error inserting into DB")
                    })

                res.redirect("/")
            }
            else{
                res.render("list",{listTitle: "Today", newListItems: foundItems})
            }
        })
        .catch((error) => { //find promise fails
            console.log(error)
        })
})

app.post("/",function(req,res){

    const itemName = req.body.newItem
    const listName = req.body.list

    const item = new Item({
        name: itemName
    })

    if(listName === "Today"){
        item.save()
        res.redirect("/")
    }
    //handle custom list
    else{
        List.findOne({name: listName})
            .then((foundList)=>{
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(error => {
                console.log(error)
            })
    }
    
})

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox.trim(); //checkbox has a value of item id
    const listName = req.body.listName

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then(function(){
            console.log("Data deleted"); // Success
        })
        .catch(function(error){
            console.log(error); // Failure
        })
    res.redirect("/")
    } else{
        List.findOneAndUpdate(
            {name:listName}, 
            { $pull: { items: { _id: checkedItemId } } })
        .then((foundList)=>{
            res.redirect("/" + listName)
        })
        .catch(err =>{
            console.log(err)
        })
    }

    
})


app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName)

    List.findOne({name: customListName}) //returns one document
    .then((foundList) => {
        if(!foundList){
            //create new list
            const list = new List({
                name: customListName,
                items:defaultItems
            })
            list.save()
            res.redirect("/" + customListName)
        } else {
            //show existing list
            res.render("list",{
                listTitle: foundList.name, 
                newListItems: foundList.items})
        }
    })
    .catch((error) =>{
        console.log(error)
    })  
})


app.listen(process.env.PORT || 3000,function(){
    console.log("Server is listening")
})
