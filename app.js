
// Create boilerplate
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const externalFunctions = require(__dirname + '/functions.js');
const app = express();
const _ = require('lodash');

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://admin:admin123@cluster76232.ammm8wy.mongodb.net/todolistDB');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set('view engine', 'ejs');

// Create schema

const itemSchema = { listName: String, listItems: []};

// Create model

const ToDoList = mongoose.model('ToDoList', itemSchema);

// Set ID counter initial value

var idCounter = 0;

// We get http request on /*customListName, so we...
app.get('/:customListName', function(req,res){
    // Make sure it does not come from favicon
    if (!req.params.customListName.includes('favicon')) {
        // Global task: show the existing items on the screen, by sending them to EJS
        // Let's get the list name from url
        let nodeListName = req.params.customListName;
        // Let's specify items we want to send - that's the whole list of items, which is an array of objects
        let nodeListItems = [];
        // Let's see what we have inside DB -> collection -> list. There should be only one item returned
        ToDoList.find({listName: _.toLower(nodeListName)}, function(err,items) {
            // Let's check if the list exists - otherwise it won't work
            if (items.length !== 0) {
            // Let's search through all items in the list
            for (let i=0; i<items[0].listItems.length; i++) {
                // Let's put items we want to send into EJS into an array
                nodeListItems[i] = items[0].listItems[i];
                // console.log('We have item ' + i + '. Its contents are ' + items[0].listItems[i]);
                // console.log('We have nodeListItem ' + i + '. Its contents are ' + nodeListItems[i]);   
                // console.log(items);         
            }
            }
            // No matter if items exist or not, we send something to EJS
            res.render('index', {ejsListName: _.capitalize(nodeListName), ejsListItems: nodeListItems});   
        });
    }
});

// So we have to delete an item from the list we have in our URL...
app.post('/:customListName/delete', (req,res) => {
    // Let's determine the ID of the item we want to delete
    deleteId = +req.body.checkbox;
    // Let's find in the list, in order to update it
    ToDoList.find({listName: _.toLower(req.params.customListName)}, function(err,items) {
            // ...Push the item at the end of an array
            let newItemArray = [];
            let j=0;
            // If the ID of the deleted item equals to ID of the item we search for, we will not include it in the new array
            for (let i=0; i<items[0].listItems.length; i++) {
                if (items[0].listItems[i].id !== deleteId) {
                    newItemArray[j] = items[0].listItems[i]
                    j++;
                }
            }
            // Let's now update the list with the new array
            ToDoList.updateOne({listName: _.toLower(req.params.customListName)}, {listItems: newItemArray}, function(err) {});
        })
        // and redirect people to the list page
        res.redirect('/' + _.toLower(req.params.customListName));
})

// We got a post request to add an item to our list (by the name of customListName), so we...
app.post('/:customListName', (req,res) => {
    // Get the list name from URL
    let nodeListName = _.toLower(req.params.customListName);
    // Redirect the user to the page which displays the list
    res.redirect('/' + nodeListName);
    // Let's prepare the item which is going to be sent. The ID is the hard part. We should get the ID of the last item in the list and only add up to that number.
    ToDoList.find({listName: nodeListName}, function(err,items) {
        // First we check if a list exists
        if (items.length === 0) {
            // If it does not, just set the ID to zero
            idCounter = 0;
            // Otherwise...
        } else {
            // Let's search through all items in the list and find the biggest ID number. For buffer purposes let's create an array that contains all ID, and then find the maximum.
            let currentID = [];
            for (let i=0; i<items[0].listItems.length; i++) {
            // Put each ID into an array
            currentID[i] = items[0].listItems[i].id;  
            }
            // Here we are! Take a max ID value and add one - this is what we are going to send into DB.
            idCounter = Math.max(...currentID) + 1;
        }
            // This is what our new item is going to consist of: content from HTML form, id that we've just determined
        console.log('The ID we pass into the item is: ' + idCounter);
        let newItem = {id: idCounter, content: req.body.newItem};
            // SOOO here we want to push an item which a person wants to add to the end of our array. 
        ToDoList.find({listName: nodeListName}, function(err,items) {
            // If the list does not exist, let's create a new one, and put new item there
            if (items.length === 0) {
                // This is out new list. Let's save it
                const newList = new ToDoList({ listName: nodeListName, listItems: [newItem] });
                newList.save();
            // If it does exist, let's...
            } else { 
                // ...Push the item at the end of an array
                items[0].listItems.push(newItem);
                const newItemArray = items[0].listItems;
                // Let's log the array of item we have now
                console.log(newItemArray);
                // Let's now update the list with the new array
                ToDoList.updateOne({listName: nodeListName}, {listItems: newItemArray}, function(err) {});
            }
        });
    });

    // Item.insertMany(nodeItem, function(err) {if (err) {console.log(err)}})
    // Item.find(function(err,items) {console.log('Array of items inside DB: ' + items)});
    // mongoose.connection.close(function(){
    //     process.exit(0);});
});

// app.post('/:customListName', (req,res) => {
//     let nodeListName = req.params.customListName;
//     res.redirect('/' + nodeListName);
//     console.log(nodeListName);
//     let newItem = {id: idCounter, content: req.body.newItem};
//     let nodeListItems = [newItem];
//     // let Item = mongoose.model(collectionName, itemSchema);
//     ToDoList.find({listName: nodeListName}, function(err,items) {
//         if (items === []) {
//             const nodeItem = new ToDoList({ listName: nodeListName, listItems: nodeListItems });
//             // console.log('Added item: ' + nodeItem);
//             nodeItem.save();
//             idCounter++;
//         } else { 
//             for (let i=0; i<items.length; i++) {
//                 nodeListItems[i] = items[i];
//                 // // console.log('We have item ' + i + '. Its contents are ' + items[i].name);
//                 // // console.log('We have nodeItem ' + i + '. Its contents are ' + nodeItems[i]);   
//                 console.log(items);         
//             }
//         }
//     });
//     // Item.insertMany(nodeItem, function(err) {if (err) {console.log(err)}})
//     // Item.find(function(err,items) {console.log('Array of items inside DB: ' + items)});
//     // mongoose.connection.close(function(){
//     //     process.exit(0);});
// });

// Listen for http requests on localhost

app.listen(3000, function(){
    console.log('Server started on port 3000');
})