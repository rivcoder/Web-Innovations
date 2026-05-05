# 🌆 CityCare
## 🌟 Overview

CityCare is a civic-tech web application designed to bridge the gap between citizens and local authorities.

It introduces a transparent, community-driven, and gamified system for reporting and resolving urban issues such as potholes, broken infrastructure, and waste management problems.

Instead of passive complaints, CityCare transforms civic responsibility into an interactive ecosystem, where:

- Citizens contribute data

- Communities prioritize issues

- Authorities act with clarity and structure


## 🚀 Key Features

### 📢 For Citizens


#### Smart Reporting

• Submit issues with detailed descriptions, categories, and precise location data

#### Visual Evidence

• Upload real-world images to provide context and improve report quality

#### Community-Driven Priority (Upvotes)

• Reports gain visibility based on public importance

#### Interactive Live Map

• View and explore all issues across the city dynamically

#### Gamified Leaderboard

• Earn points for valid reports and resolutions — become a Civic Hero

#### Discussion Threads

• Collaborate via comments on specific reports


### For Authorities


#### Centralized Dashboard

• View all reports ranked by urgency and community priority

#### Lifecycle Management

• Track issues across stages:

• Sent → In Progress → Resolved

#### Automated Reward Engine

• Closing a report updates user credibility and engagement scores

## Tech-Stack

• Backend: Python (Flask) 

• Database: SQL (SQLAlchemy ORM)  

• Authentication: Flask-Login  

• Security: Flask-Bcrypt  

• Frontend: HTML5, CSS3, Vanilla JavaScript (Fetch API)  

• Styling: Modern UI (Glassmorphism + Responsive Design) 


## 🧠 System Architecture

#### CityCare follows a Client–Server architecture with a strong emphasis on data consistency and user interaction flow:

1. Report Submission

• User submits issue (form data + image upload)

2. Backend Processing

• Flask handles validation, storage, and database transactions

3. Data Persistence

• Reports, users, and interactions stored via SQLAlchemy

4. Community Interaction Loop

• Users fetch reports → view → upvote → comment

5. Resolution Flow

• Authorities update report status

6. Gamification Trigger

• System rewards the original reporter automatically


### 🤖 AI Usage Disclosure

AI tools were used to:

- Assist in debugging and optimization

- Improve UI/UX structure

- Refine documentation

However, the following were intentionally designed:

- System architecture

- Database schema

- Report lifecycle logic

Gamification mechanics

This project reflects applied understanding of full-stack engineering.


## 📈 Future Roadmap
- Real-time notifications (status updates)
 
- AI-based image classification (auto-tagging issues)
 
- Social sharing for resolved reports
 
- Analytics dashboard (heatmaps, trends)
 
-  Role-based admin system (multi-authority support)
