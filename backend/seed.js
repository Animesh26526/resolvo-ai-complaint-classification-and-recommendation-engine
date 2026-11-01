const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userModel = require("./src/models/user.model");
const complaintModel = require("./src/models/complaint.model");
const resolutionModel = require("./src/models/resolution.model");
const qaReviewModel = require("./src/models/qaReview.model");
const connectDatabase = require("./src/db/db");
require("dotenv").config();

async function seedDatabase() {
    try {
        await connectDatabase();
        console.log("Database connected for seeding...");

        // Clear existing data
        console.log("Clearing existing data...");
        await userModel.deleteMany({});
        await complaintModel.deleteMany({});
        await resolutionModel.deleteMany({});
        await qaReviewModel.deleteMany({});

        // Create Users
        console.log("Creating users...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const usersData = [
            { name: "Demo Customer", email: "customer@demo.com", password: hashedPassword, role: "customer", isEmailVerified: true },
            { name: "Demo CSE", email: "cse@demo.com", password: hashedPassword, role: "cse", isEmailVerified: true },
            { name: "Demo QAT", email: "qat@demo.com", password: hashedPassword, role: "qat", isEmailVerified: true },
            { name: "Demo OM", email: "om@demo.com", password: hashedPassword, role: "om", isEmailVerified: true },
            { name: "Alice Customer", email: "alice@demo.com", password: hashedPassword, role: "customer", isEmailVerified: true },
            { name: "Bob Customer", email: "bob@demo.com", password: hashedPassword, role: "customer", isEmailVerified: true }
        ];

        const users = await userModel.insertMany(usersData);
        
        const customerId = users.find(u => u.email === "customer@demo.com")._id;
        const aliceId = users.find(u => u.email === "alice@demo.com")._id;
        const bobId = users.find(u => u.email === "bob@demo.com")._id;
        const cseId = users.find(u => u.email === "cse@demo.com")._id;
        const qatId = users.find(u => u.email === "qat@demo.com")._id;

        // Create Complaints
        console.log("Creating complaints...");
        
        const complaintsData = [
            // Received Complaints
            {
                description: "The product box was torn and the item inside was scratched.",
                channel: "email",
                customer: customerId,
                status: "Received"
            },
            {
                description: "I was overcharged for the trade discount in my last order.",
                channel: "call",
                customer: aliceId,
                status: "Received"
            },
            // Analyzed Complaints
            {
                description: "The software keeps crashing when I try to export my report.",
                channel: "text",
                customer: bobId,
                status: "Analyzed",
                category: "Product",
                priority: "High",
                sentiment: "Negative",
                aiRecommendation: "Offer a bug fix timeline and temporary workaround.",
            },
            // Assigned Complaints
            {
                description: "My delivery is delayed by 3 days.",
                channel: "chatbot",
                customer: customerId,
                status: "Assigned",
                category: "Trade",
                priority: "Medium",
                sentiment: "Neutral",
                aiRecommendation: "Check delivery status with logistics partner and update customer.",
                assignedTo: cseId,
                slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
            },
            // In Progress Complaints
            {
                description: "The quality of the material is not what was advertised.",
                channel: "email",
                customer: aliceId,
                status: "In Progress",
                category: "Product",
                priority: "High",
                sentiment: "Very Negative",
                aiRecommendation: "Process a return or exchange immediately.",
                assignedTo: cseId,
                slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
            },
            // Resolved Complaints
            {
                description: "The packaging seal was broken upon arrival.",
                channel: "direct",
                customer: bobId,
                status: "Resolved",
                category: "Packaging",
                priority: "Medium",
                sentiment: "Negative",
                aiRecommendation: "Send a replacement product and apologize.",
                assignedTo: cseId,
                resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            }
        ];

        // Insert complaints one by one to trigger pre-save validators for complaintId
        const createdComplaints = [];
        for (const data of complaintsData) {
            const comp = new complaintModel(data);
            await comp.save();
            createdComplaints.push(comp);
        }

        const resolvedComplaint = createdComplaints.find(c => c.status === "Resolved");
        
        // Create Resolution
        console.log("Creating resolutions...");
        const res1 = new resolutionModel({
            complaint: resolvedComplaint._id,
            recommendation: "Send a replacement product and apologize.",
            remarks: "Customer provided photos. Replacement dispatched.",
            actionTaken: "Replacement Sent",
            resolvedBy: cseId,
            resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });
        await res1.save();

        // Update complaint with resolution reference
        resolvedComplaint.resolution = res1._id;
        await resolvedComplaint.save();

        // Create QA Review
        console.log("Creating QA reviews...");
        const qa1 = new qaReviewModel({
            complaint: resolvedComplaint._id,
            reviewer: qatId,
            classificationResult: "Agreed",
            reviewRemarks: "Good handling of the replacement.",
            originalAiAnalysis: {
                category: "Packaging",
                sentiment: "Negative",
                priority: "Medium",
                recommendation: "Send a replacement product and apologize."
            }
        });
        await qa1.save();
        
        const inProgressComplaint = createdComplaints.find(c => c.status === "In Progress");
        const qa2 = new qaReviewModel({
            complaint: inProgressComplaint._id,
            reviewer: qatId,
            classificationResult: "Corrected",
            reviewRemarks: "Priority should be high due to material defect.",
            correctedCategory: "Product",
            correctedPriority: "High",
            originalAiAnalysis: {
                category: "Product",
                sentiment: "Very Negative",
                priority: "Medium",
                recommendation: "Process a return or exchange immediately."
            }
        });
        await qa2.save();


        console.log("Seeding completed successfully!");
        console.log("-----------------------------------------");
        console.log("Demo Logins:");
        console.log("Customer : customer@demo.com | password123");
        console.log("CSE      : cse@demo.com      | password123");
        console.log("QAT      : qat@demo.com      | password123");
        console.log("OM       : om@demo.com       | password123");
        console.log("-----------------------------------------");
        
        process.exit(0);

    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
