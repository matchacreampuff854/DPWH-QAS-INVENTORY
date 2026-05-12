# DPWH Quality Assurance Inventory

A functional web application for managing the inventory of materials in the DPWH Quality Assurance Office.

## Features

- Add new materials with ID, name, category, quantity, status, maintenance expiry date, and calibration schedule
- Delete existing materials
- Search materials by ID, name, or category
- View inventory in a responsive table
- Analytics chart showing the percentage of functioning materials per category
- Notification bar for upcoming maintenance and calibration reminders
- Modern, clean design with orange and blue color palette
- Responsive layout for mobile and desktop

## Color Palette

- White (#ffffff) for backgrounds and text contrast
- Orange (#ff6600) for buttons, notifications, and accents
- Blue (#007bff) for headers, borders, and secondary elements

## Notifications

The notification bar alerts users about:
- Maintenance expiry dates (30 days in advance)
- Overdue maintenance
- Upcoming calibration schedules (30 days in advance)
- Overdue calibrations

## How to Use

1. Open `index.html` in a web browser.
2. Fill in the form to add a new material, including optional maintenance and calibration dates.
3. Use the search bar to filter materials by ID, name, or category.
4. View the analytics chart for functioning percentages.
5. Check the notification bar for maintenance and calibration reminders.

## Technologies Used

- HTML5
- CSS3 with modern features (gradients, flexbox, grid)
- JavaScript (ES6)
- Chart.js for data visualization
- Local Storage for data persistence
- Google Fonts (Roboto)

## File Structure

- `index.html`: Main HTML file
- `styles.css`: CSS styles with responsive design
- `script.js`: JavaScript functionality
- `README.md`: This documentation