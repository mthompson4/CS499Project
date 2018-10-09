    // initialize the firebase contents, codemirror object, and firepad object
    function init() {
      var config = {
        apiKey: "AIzaSyAKULc7VqbYUHAAehKR0bDf42WRLyTKch0",
        authDomain: "test-project-5632e.firebaseapp.com",
        databaseURL: "https://test-project-5632e.firebaseio.com",
        projectId: "test-project-5632e",
        storageBucket: "test-project-5632e.appspot.com",
        messagingSenderId: "214812957898"
      };
      firebase.initializeApp(config);
      // var storage = firebase.storage();

      //// Get Firebase Database reference.
      // var firepadRef = getExampleRef();

      // Add Event Listeners to our DOM elements because onclick() won't work w/firepad object
      // document.getElementById('saveButton').addEventListener('click',function(){
      //   saveToCloud(firepad, storage);
      // });

      // Create a random ID to use as our user ID (we must give this to firepad and FirepadUserList).
      // var userId = Math.floor(Math.random() * 9999999999).toString();

      //// Create Firepad (with rich text features and our desired userId).
      // var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
      //     { userId: userId});

      // //// Create FirepadUserList (with our desired userId).
      // var firepadUserList = FirepadUserList.fromDiv(firepadRef.child('users'),
      //     document.getElementById('userlist'), userId);

      updateTimestamp();
    }

    // Save a file to the cloud and update the save timestamp
    function saveToCloud(firepad, storage){
      // grab the timestamp element
      var saveTimestampElement = document.getElementById('saveTimestamp');
      saveTimestampElement.innerHTML = 'Saving......';
      // get the firebase storage ref
      var storageRef = storage.ref();
      var filename = 'index.html';
      var testRef = storageRef.child(filename);
      // grab the contents of the editor as a string
      var message = firepad.getText();
      // putString saves the file to firebase storage
      testRef.putString(message).then(function(snapshot) {
        // grab the current timestamp
        let date = new Date();
        let saveTimestamp = date.toLocaleTimeString();
        saveTimestampElement.innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
        // set the ref in the firebase database with the timestamp
        var databaseRef = firebase.database().ref().child('/save');
        var postData = {
          "Timestamp": saveTimestamp
        };
        databaseRef.set(postData);
      });
    }

    // update the save timestamp when saved
    function updateTimestamp(){
      var timestampRef = firebase.database().ref('/save');
      // listen for changes to the value of the timestamp
      timestampRef.on('value', function(snapshot){
        var saveTimestamp = snapshot.val()["Timestamp"];
        document.getElementById('saveTimestamp').innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
      })
    }

    // Helper to get hash from end of URL or generate a random one.
    function getExampleRef() {
      var ref = firebase.database().ref();
      return ref;
    }