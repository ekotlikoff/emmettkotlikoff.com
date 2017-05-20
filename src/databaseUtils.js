import * as firebase from 'firebase';

export const connectToDB = () => {
  const promise = firebase.auth().signInAnonymously();
  promise.then((user) => {
    // User is signed in.
    const database = firebase.database();
    database.ref('users/' + user.uid).set({
      xCoordinate: 1,
      yCoordinate: 1,
    });
    database.ref('users/' + user.uid).onDisconnect().remove();
  }).catch((error) => {
    console.log(error.code);
    console.log(error.message);
  });
  return promise;
}
