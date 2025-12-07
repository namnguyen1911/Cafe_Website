Sau Luc Coffee Roastery Website - Project Report

1. Project Information
- Project name: Sau Luc Coffee Roastery Website
- Author: Nam Nguyen
- Date: Fall Semester 2025
- Project type: Fullstack web application

2. Project Overview
This project builds a fullstack e-commerce website for Sau Luc Coffee, a family-owned roastery that has been operating for decades but is still mainly known only within the local community. The website aims to make the business look more legitimate online, expand its reach beyond nearby neighborhoods, and provide modern online ordering capabilities.
The system allows customers to browse product information, place online orders, and create accounts, while also helping the business collect and store customer data for future marketing and operational purposes. It also lays the foundation for better inventory management and reporting in the future.

3. Scope and Implemented Features
In this version of the project, the main implemented features are:
- Product management: create and update products.
- User and seller management with authentication.
- Online ordering: customers can add products to a cart and place orders.
- Order tracking: store and view online orders.

These features focus on enabling core e-commerce flows for both customers and sellers.

4. Design and Technology
The project uses a modern JavaScript-based tech stack:

- Frontend: Vite + React + Tailwind CSS for a responsive, component-based user interface.
- Backend: Node.js with Express for building a RESTful API server.
- Database: MongoDB for storing users, products, categories, orders, and addresses.
- Authentication and security:
  - JWT-based authentication with cookies to manage user vs seller roles.
  - CSRF protection using tokens in cookies/headers.
  - CORS whitelist to control which frontends can access the API.
- File and image handling: Multer is used to handle image uploads, and Cloudinary is used to store and serve product images.
- Payments: Stripe Checkout is integrated for online payment, with keys and secrets stored in environment variables.
- Deployment: The frontend is deployed on Vercel, with rewrite rules that forward /api/* requests to the backend. Environment variables are separated into .env for production and .env.local for development.

The main MongoDB collections are:
- users: stores userId, email, password, name, and cart items.
- products: stores productId, name, category, description, price, offerPrice, image, stock status, and timestamps.
- category: stores categoryId and name for product classification.
- orders: stores orderId, userId, payment type, ordered items, total amount, status, payment flag, and timestamps.
- addresses: stores shipping and contact information such as name, email, street, city, state, country, zipcode, and phone.

5. Implementation, Challenges, and Testing
Implementation highlights:
- Manually designed and implemented API endpoints for login, logout, authentication, and product fetching.
- Integrated JWT cookies, CSRF tokens, and CORS configuration to secure cross-origin requests.
- Connected the frontend React components to backend APIs for product listing, cart operations, and order placement.

Challenges faced during development included:
- Improving coding style and organizing files and folders.
- Learning and configuring Vercel deployment, Stripe integration, and environment variables.
- Designing clean and consistent API structures.
- Understanding the overall application architecture (frontend, backend, database, and external services).
- Learning React and Tailwind CSS from a practical project perspective.
- Handling cookies across different origins and ensuring authentication works reliably.

Testing and results:
- Initial backend endpoints were tested using Postman.
- During development, the application was tested locally on localhost.
- After deployment, the production version on Vercel was used for further testing.
The core use cases work as expected: users can register, log in, add or remove products from the cart, and place orders. Sellers can add and modify products, toggle in-stock/out-of-stock status, and keep track of online orders. Products are displayed with detailed information for customers.

6. Future Work and Conclusion
Planned improvements for future versions include:
- Limit login attempts to reduce brute-force attacks.
- Restrict product image upload size for performance and storage control.
- Implement real-time product inventory tracking.
- Add an About page to tell the story of Sau Luc Coffee.
- Allow deleting products from the catalog.
- Generate printable daily, monthly, and yearly reports for sales and operations.
- Explore inventory updates via barcode scanning and photo-based input from mobile devices.

In conclusion, the Sau Luc Coffee Roastery Website successfully delivers a working fullstack e-commerce platform tailored to a local coffee roastery. It provides online ordering, basic customer and product management, and a strong technical foundation for future growth in both features and business scale.

