/**
 * Validate ride creation/update data
 */
export const validateRideData = (data, isUpdate = false) => {
  const errors = {};

  // Source validation
  if (!isUpdate || data.source_address !== undefined) {
    if (!data.source_address || data.source_address.trim().length < 5) {
      errors.source_address = 'Source address must be at least 5 characters';
    }
  }

  if (!isUpdate || data.source_lat !== undefined) {
    if (data.source_lat === undefined || data.source_lat === null) {
      errors.source_lat = 'Source latitude is required';
    } else if (data.source_lat < -90 || data.source_lat > 90) {
      errors.source_lat = 'Source latitude must be between -90 and 90';
    }
  }

  if (!isUpdate || data.source_lng !== undefined) {
    if (data.source_lng === undefined || data.source_lng === null) {
      errors.source_lng = 'Source longitude is required';
    } else if (data.source_lng < -180 || data.source_lng > 180) {
      errors.source_lng = 'Source longitude must be between -180 and 180';
    }
  }

  // Destination validation
  if (!isUpdate || data.destination_address !== undefined) {
    if (!data.destination_address || data.destination_address.trim().length < 5) {
      errors.destination_address = 'Destination address must be at least 5 characters';
    }
  }

  if (!isUpdate || data.destination_lat !== undefined) {
    if (data.destination_lat === undefined || data.destination_lat === null) {
      errors.destination_lat = 'Destination latitude is required';
    } else if (data.destination_lat < -90 || data.destination_lat > 90) {
      errors.destination_lat = 'Destination latitude must be between -90 and 90';
    }
  }

  if (!isUpdate || data.destination_lng !== undefined) {
    if (data.destination_lng === undefined || data.destination_lng === null) {
      errors.destination_lng = 'Destination longitude is required';
    } else if (data.destination_lng < -180 || data.destination_lng > 180) {
      errors.destination_lng = 'Destination longitude must be between -180 and 180';
    }
  }

  // Departure time validation
  if (!isUpdate || data.departure_time !== undefined) {
    if (!data.departure_time) {
      errors.departure_time = 'Departure time is required';
    } else {
      const departureDate = new Date(data.departure_time);
      if (isNaN(departureDate.getTime())) {
        errors.departure_time = 'Invalid departure time format';
      } else if (departureDate <= new Date()) {
        errors.departure_time = 'Departure time must be in the future';
      }
    }
  }

  // Available seats validation
  if (!isUpdate || data.available_seats !== undefined) {
    if (!data.available_seats || data.available_seats < 1) {
      errors.available_seats = 'At least 1 seat must be available';
    } else if (data.available_seats > 8) {
      errors.available_seats = 'Cannot offer more than 8 seats';
    }
  }

  // Price validation
  if (!isUpdate || data.price_per_seat !== undefined) {
    if (data.price_per_seat === undefined || data.price_per_seat === null) {
      errors.price_per_seat = 'Price per seat is required';
    } else if (data.price_per_seat < 0) {
      errors.price_per_seat = 'Price cannot be negative';
    } else if (data.price_per_seat > 10000) {
      errors.price_per_seat = 'Price seems unreasonably high';
    }
  }

  // Distance validation (optional)
  if (data.distance_km !== undefined && data.distance_km !== null) {
    if (data.distance_km < 0) {
      errors.distance_km = 'Distance cannot be negative';
    } else if (data.distance_km > 1000) {
      errors.distance_km = 'Distance seems unreasonably long';
    }
  }

  // Duration validation (optional)
  if (data.duration_minutes !== undefined && data.duration_minutes !== null) {
    if (data.duration_minutes < 0) {
      errors.duration_minutes = 'Duration cannot be negative';
    } else if (data.duration_minutes > 1440) {
      errors.duration_minutes = 'Duration cannot exceed 24 hours';
    }
  }

  // Recurring ride validation
  if (data.is_recurring) {
    if (!data.recurrence_pattern) {
      errors.recurrence_pattern = 'Recurrence pattern is required for recurring rides';
    } else {
      const pattern = data.recurrence_pattern;
      if (!pattern.frequency || !['daily', 'weekly', 'custom'].includes(pattern.frequency)) {
        errors.recurrence_pattern = 'Invalid recurrence frequency';
      }
      if (pattern.frequency === 'weekly' && (!pattern.daysOfWeek || !Array.isArray(pattern.daysOfWeek))) {
        errors.recurrence_pattern = 'Days of week required for weekly recurrence';
      }
      if (!pattern.endDate) {
        errors.recurrence_pattern = 'End date required for recurring rides';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate search parameters
 */
export const validateSearchParams = (params) => {
  const errors = {};

  // Source coordinates
  if (params.source_lat === undefined || params.source_lat === null || isNaN(params.source_lat)) {
    errors.source_lat = 'Valid source latitude is required';
  } else if (params.source_lat < -90 || params.source_lat > 90) {
    errors.source_lat = 'Source latitude must be between -90 and 90';
  }

  if (params.source_lng === undefined || params.source_lng === null || isNaN(params.source_lng)) {
    errors.source_lng = 'Valid source longitude is required';
  } else if (params.source_lng < -180 || params.source_lng > 180) {
    errors.source_lng = 'Source longitude must be between -180 and 180';
  }

  // Destination coordinates
  if (params.destination_lat === undefined || params.destination_lat === null || isNaN(params.destination_lat)) {
    errors.destination_lat = 'Valid destination latitude is required';
  } else if (params.destination_lat < -90 || params.destination_lat > 90) {
    errors.destination_lat = 'Destination latitude must be between -90 and 90';
  }

  if (params.destination_lng === undefined || params.destination_lng === null || isNaN(params.destination_lng)) {
    errors.destination_lng = 'Valid destination longitude is required';
  } else if (params.destination_lng < -180 || params.destination_lng > 180) {
    errors.destination_lng = 'Destination longitude must be between -180 and 180';
  }

  // Date validation (optional)
  if (params.date) {
    const searchDate = new Date(params.date);
    if (isNaN(searchDate.getTime())) {
      errors.date = 'Invalid date format';
    }
  }

  // Passengers validation
  if (params.passengers !== undefined) {
    if (isNaN(params.passengers) || params.passengers < 1) {
      errors.passengers = 'Number of passengers must be at least 1';
    } else if (params.passengers > 8) {
      errors.passengers = 'Number of passengers cannot exceed 8';
    }
  }

  // Radius validation
  if (params.radius !== undefined) {
    if (isNaN(params.radius) || params.radius < 1) {
      errors.radius = 'Search radius must be at least 1 km';
    } else if (params.radius > 50) {
      errors.radius = 'Search radius cannot exceed 50 km';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate filter options
 */
export const validateFilterOptions = (options) => {
  const errors = {};

  if (options.minRating !== undefined) {
    if (isNaN(options.minRating) || options.minRating < 0 || options.minRating > 5) {
      errors.minRating = 'Rating must be between 0 and 5';
    }
  }

  if (options.maxPrice !== undefined) {
    if (isNaN(options.maxPrice) || options.maxPrice < 0) {
      errors.maxPrice = 'Maximum price must be positive';
    }
  }

  if (options.minPrice !== undefined) {
    if (isNaN(options.minPrice) || options.minPrice < 0) {
      errors.minPrice = 'Minimum price must be positive';
    }
  }

  if (options.minPrice && options.maxPrice && options.minPrice > options.maxPrice) {
    errors.price = 'Minimum price cannot be greater than maximum price';
  }

  if (options.vehicleType) {
    const validTypes = ['sedan', 'suv', 'hatchback', 'mini', 'luxury'];
    if (!validTypes.includes(options.vehicleType)) {
      errors.vehicleType = 'Invalid vehicle type';
    }
  }

  if (options.sortBy) {
    const validSortFields = ['price', 'rating', 'departure_time', 'distance'];
    if (!validSortFields.includes(options.sortBy)) {
      errors.sortBy = 'Invalid sort field';
    }
  }

  if (options.sortOrder) {
    if (!['asc', 'desc'].includes(options.sortOrder)) {
      errors.sortOrder = 'Sort order must be "asc" or "desc"';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate recurrence pattern
 */
export const validateRecurrencePattern = (pattern) => {
  const errors = {};

  if (!pattern.frequency) {
    errors.frequency = 'Frequency is required';
  } else if (!['daily', 'weekly', 'custom'].includes(pattern.frequency)) {
    errors.frequency = 'Invalid frequency. Must be daily, weekly, or custom';
  }

  if (!pattern.endDate) {
    errors.endDate = 'End date is required';
  } else {
    const endDate = new Date(pattern.endDate);
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid end date format';
    } else if (endDate <= new Date()) {
      errors.endDate = 'End date must be in the future';
    }
  }

  if (pattern.frequency === 'weekly') {
    if (!pattern.daysOfWeek || !Array.isArray(pattern.daysOfWeek)) {
      errors.daysOfWeek = 'Days of week array is required for weekly frequency';
    } else if (pattern.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'At least one day must be selected';
    } else {
      const invalidDays = pattern.daysOfWeek.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.daysOfWeek = 'Days must be between 0 (Sunday) and 6 (Saturday)';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};