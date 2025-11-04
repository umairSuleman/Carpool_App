// backend/utils/bookingValidation.js

/**
 * Validate booking creation data
 */
export const validateBookingData = (data) => {
  const errors = {};

  if (!data.ride_id) {
    errors.ride_id = 'Ride ID is required';
  }

  if (!data.seats_booked || data.seats_booked < 1) {
    errors.seats_booked = 'You must book at least 1 seat';
  } else if (data.seats_booked > 8) {
    errors.seats_booked = 'Cannot book more than 8 seats';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate cancellation data
 */
export const validateCancellationData = (data) => {
  const errors = {};

  if (!data.reason || data.reason.trim().length < 5) {
    errors.reason = 'A cancellation reason of at least 5 characters is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate rating data
 */
export const validateRatingData = (data) => {
  const errors = {};

  if (data.rating === undefined || data.rating === null) {
    errors.rating = 'Rating is required';
  } else if (data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  if (data.review && data.review.length > 500) {
    errors.review = 'Review cannot exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};