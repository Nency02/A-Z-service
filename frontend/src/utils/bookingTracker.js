// Simple booking tracking system
// In a real app, this would be handled by a backend API

let userBookings = [];

export const addBooking = (bookingData) => {
  const booking = {
    id: Date.now(),
    ...bookingData,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  userBookings.push(booking);
  return booking;
};

export const getBookings = (userId) => {
  return userBookings.filter(booking => booking.userId === userId);
};

export const updateBookingStatus = (bookingId, status) => {
  const booking = userBookings.find(b => b.id === bookingId);
  if (booking) {
    booking.status = status;
    return booking;
  }
  return null;
};

export const cancelBooking = (bookingId) => {
  const index = userBookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    userBookings.splice(index, 1);
    return true;
  }
  return false;
};
