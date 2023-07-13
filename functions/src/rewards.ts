import * as functions from "firebase-functions";

const admin = require('firebase-admin');

const firestoreInstance = admin.firestore();


function getFoodReward(price: int, foodSales: int, totalSales: int) {
    return (price / 10) * (totalSales / foodSales)
}

exports.buyFood = functions.https.onRequest(async (req, res) => {
    const res = await firestoreInstance.runTransaction(async t => {
        try {
            const foodRequest = t.get(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id));
        const restaurantRequest = t.get(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id));

        const food = (await foodRequest).data();
        const restaurant = (await restaurantRequest).data();

        const reward = getFoodReward(food['price'], food['sales'], restaurant['total_sales']);

        Promise.all([
        t.update(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id), {
            sales: food['sales'] + 1,
            reward: reward
        }),
        t.update(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id), {
            total_sales: restaurant['total_sales'] + 1
        })]);
            return 200;
        } catch(e) {
            return 400;
        }
      });

      res.sendStatus(res);
});