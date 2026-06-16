/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51TiCvlFIfvY3N2VG3fXp4L1q3uAzpZ6qtzFUGv5T5DcRULPupeXOCzCrPg7DLNvfYBlTeQ4FneEJbv0wdJaOwmFe00TwSVVD0f');

export const bookTour = async(tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    
    // 2) Create checkout form + charge credit card
    window.location.href = session.data.session.url;
    
    // Jonas way ( old ):
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id
    // })

  } catch (err) {
    console.log(err)
    showAlert("error", err.message);
  }
}