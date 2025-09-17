import React from "react";

function Contact() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-600">Contact Us</h1>
      <p className="mt-4 text-gray-700">
        Have questions or need our services? Get in touch with us today!
      </p>

      <form className="mt-6 max-w-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Message</label>
          <textarea
            placeholder="Write your message..."
            className="w-full border p-2 rounded h-28"
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Message
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Other Ways to Reach Us</h2>
        <p className="mt-2">📍 Ahmedabad, Gujarat, India</p>
        <p>📞 +91 98765 43210</p>
        <p>✉️ contact@azglobe-gujarat.com</p>
      </div>
    </div>
  );
}

export default Contact;
