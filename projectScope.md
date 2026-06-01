# AI-Powered Ticket Management System

## Problem

Each day, hundreds of support emails are received for an online computer programming course business. People ask questions, report technical issues, request refunds, etc.
The business currently uses Freshdesk to manage this and human agents work through each reported issue to determine if they can be resolved using a knowledgebase of commonly asked questions canned response or if they actually need human intervention to answer.

## Issues

* Humans don't like canned answers - they can feel impersonal
* This process is slow - humans have to open the ticket, read it, think about it, go through the knowledgebase and reply to the user. Humans also only work during their work shift so the user may not receive an email in a timely fashion.

## Solution

* Build an A.I. driven ticket management system.
* The system would read the ticket and classify it. Is it a general question, a technical issue a refund request etc.
* Determine if the question can be automatically resolved using the knowledge base.

  * If so, compose an automated human-friendly response, not a canned template and send it to the user.
  * If not, assign the ticket to a human agent. When the human agent drafts a response to the user, the user can click a button to "polish" the response using AI.

## Features

* Receive support emails and create tickets
* Auto-generate human-friendly responses using a knowledge base
* Ticket list with filtering and sorting
* Ticket detail view
* AI-powered ticket classification
* AI summaries
* AI-suggested replies
* User management (admin only)
* Dashboard to view and manage all tickets

## Ticket Details

### Statuses
* Open — ticket has been received and is awaiting resolution
* Resolved — a response has been sent to the customer
* Closed — ticket has been confirmed closed, no further action needed

### Categories
* General question
* Technical question
* Refund request

## Ticket Assignment

Tickets go into a shared queue. Any agent can pick up and respond to any ticket.

## User Roles

* **Admin** — the initial user created at system deployment. Can create and manage agent accounts.
* **Agent** — can view and respond to tickets.

