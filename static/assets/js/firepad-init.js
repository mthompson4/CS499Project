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
      var storage = firebase.storage();

      //// Get Firebase Database reference.
      var firepadRef = getExampleRef();

      //// Create CodeMirror (with lineWrapping on).
      var codeMirror = CodeMirror(document.getElementById('firepad'), { lineWrapping: true,
        lineNumbers: true,
        mode: 'xml'
      });

      // Add Event Listeners to our DOM elements because onclick() won't work w/firepad object

      document.getElementById('saveButton').addEventListener('click',function(){
        saveToCloud(firepad, storage);
      });

      // Create a random ID to use as our user ID (we must give this to firepad and FirepadUserList).
      var userId = Math.floor(Math.random() * 9999999999).toString();

      //// Create Firepad (with rich text features and our desired userId).
      var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
          { userId: userId});

      //// Create FirepadUserList (with our desired userId).
      var firepadUserList = FirepadUserList.fromDiv(firepadRef.child('users'),
          document.getElementById('userlist'), userId);
    }

    function saveToCloud(firepad, storage){
      var storageRef = storage.ref();
      var filename = 'index.html';
      var testRef = storageRef.child(filename);
      var message = firepad.getText();
      testRef.putString(message).then(function(snapshot) {
        alert('Uploaded file successfully!!');
      });
    }

    // Helper to get hash from end of URL or generate a random one.
    function getExampleRef() {
      var ref = firebase.database().ref();
      return ref;
    }