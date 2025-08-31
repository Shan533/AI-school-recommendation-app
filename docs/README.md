# AI School Recommend App - Documentation

Welcome to the comprehensive documentation for the AI School Recommend App. This directory contains all the information you need to understand, develop, and maintain the application.

## 🚀 Quick Start

New to the project? Start here:

1. **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 5 minutes
2. **[setup-instructions.md](./setup-instructions.md)** - Detailed environment setup
3. **[design/design-doc.mdc](./design/design-doc.mdc)** - Understand the application architecture

## 📚 Documentation Structure

### 🎯 Design & Architecture
**[design/](./design/)** - All design decisions and technical specifications
- **[design-doc.mdc](./design/design-doc.mdc)** - Complete application design and features
- **[schema-design.mdc](./design/schema-design.mdc)** - Database design and relationships
- **[implementation-plan.mdc](./design/implementation-plan.mdc)** - Development roadmap
- **[search-system-design.md](./design/search-system-design.md)** - Intelligent search system architecture

### 🧪 Testing & Quality
**[testing/](./testing/)** - Testing strategies and feature-specific guides
- **[testing-guide.md](./testing/testing-guide.md)** - Comprehensive testing guide
- **[testing-plan.md](./testing/testing-plan.md)** - Testing strategy and methodology
- **[features/](./testing/features/)** - Feature-specific testing documentation

### ⚙️ Setup & Configuration
- **[setup-instructions.md](./setup-instructions.md)** - Environment configuration
- **[env.local.example](./env.local.example)** - Environment variables template
- **[file-structure.mdc](./file-structure.mdc)** - Project structure overview

### 📖 Additional Resources
- **[documentation-guidelines.mdc](./documentation-guidelines.mdc)** - How to write and maintain docs
- **[ai_prompt.md](./ai_prompt.md)** - AI assistant context and guidelines

## 🎯 What You'll Find Here

### For Developers
- **Architecture Overview**: Understand the Next.js 15 + Supabase stack
- **Component Library**: shadcn/ui components and custom implementations  
- **Database Design**: PostgreSQL schema with Row-Level Security
- **Authentication**: Supabase Auth with role-based access control
- **Search System**: Advanced search with intelligent ranking
- **Testing Strategy**: Jest + React Testing Library + Docker

### For Product Managers
- **Feature Specifications**: Complete feature documentation
- **User Flows**: Admin dashboard and public browsing workflows
- **Data Models**: School, program, and review data structures
- **Roadmap**: Implementation phases and future enhancements

### For Designers
- **UI Components**: Tailwind CSS + shadcn/ui design system
- **Mobile-First**: Responsive design patterns
- **Accessibility**: WCAG compliance and keyboard navigation
- **User Experience**: Search, filtering, and review workflows

## 🏗️ Application Overview

### Core Features
- **School & Program Management**: CRUD operations with CSV bulk upload
- **Advanced Search**: Multi-level ranking with abbreviation support
- **Review System**: User reviews with admin moderation
- **Authentication**: Secure login with role-based access
- **Responsive Design**: Mobile-first with perfect desktop experience

### Technology Stack
- **Frontend**: Next.js 15.4.6 (App Router) + React 19.1.0
- **Backend**: Supabase 2.55.0 (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS 4.x + shadcn/ui + Radix UI
- **Forms**: React Hook Form 7.62.0 + Zod 4.0.15
- **Testing**: Jest 30.0.5 + React Testing Library
- **Deployment**: Vercel with Analytics

### Development Workflow
1. **Design First**: Document features before implementation
2. **Test-Driven**: Write tests alongside feature development
3. **Component-Based**: Reusable, configurable components
4. **Type-Safe**: Full TypeScript coverage with validation

## 📖 Reading Guide

### I'm New to the Project
1. Start with [QUICKSTART.md](./QUICKSTART.md)
2. Read [design/design-doc.mdc](./design/design-doc.mdc)
3. Follow [setup-instructions.md](./setup-instructions.md)
4. Explore [testing/testing-guide.md](./testing/testing-guide.md)

### I'm Adding a New Feature
1. Review [design/](./design/) for architectural patterns
2. Check [testing/features/](./testing/features/) for similar feature tests
3. Follow [documentation-guidelines.mdc](./documentation-guidelines.mdc)
4. Update relevant design and testing documentation

### I'm Debugging an Issue
1. Check [testing/testing-guide.md](./testing/testing-guide.md) for troubleshooting
2. Review feature-specific testing guides in [testing/features/](./testing/features/)
3. Examine [design/schema-design.mdc](./design/schema-design.mdc) for data issues
4. Use [file-structure.mdc](./file-structure.mdc) to navigate the codebase

### I'm Setting Up the Environment
1. Follow [setup-instructions.md](./setup-instructions.md) step by step
2. Use [env.local.example](./env.local.example) for environment variables
3. Run through [QUICKSTART.md](./QUICKSTART.md) to verify setup
4. Execute tests with [testing/testing-guide.md](./testing/testing-guide.md)

## 🔄 Documentation Maintenance

This documentation is actively maintained and updated with each feature release. When contributing:

1. **Update Relevant Docs**: Modify documentation alongside code changes
2. **Follow Guidelines**: Use [documentation-guidelines.mdc](./documentation-guidelines.mdc)
3. **Test Documentation**: Verify instructions work on clean environments
4. **Keep It Current**: Remove outdated information promptly

## 📞 Need Help?

- **Setup Issues**: Check [setup-instructions.md](./setup-instructions.md) and [testing/testing-guide.md](./testing/testing-guide.md)
- **Architecture Questions**: Review [design/](./design/) documentation
- **Feature Development**: Consult [testing/features/](./testing/features/) guides
- **General Questions**: Start with this README and follow the reading guide

---

**Last Updated**: December 2024  
**Documentation Version**: 2.0  
**Application Version**: Phase 2 Complete