# Testing Documentation

This directory contains comprehensive testing documentation for the AI School Recommend App, organized by feature areas and development phases.

## 📋 Quick Navigation

### 🧪 Current Testing (Phase 1)
- **[Testing Plan](./testing-plan.md)** - Main testing overview and index
- **[Testing Implementation Plan](./testing-implementation-plan.md)** - ⭐ **NEW**: Unit test implementation roadmap and priorities
- **[Core Setup Testing](./core-setup-testing.md)** - Environment setup and basic functionality
- **[Admin CRUD Testing](./admin-crud-testing.md)** - Complete CRUD operations for schools and programs
- **[CSV Upload Testing](./csv-upload-testing.md)** - Bulk data import functionality
- **[Public Pages Testing](./public-pages-testing.md)** - User-facing school and program browsing

### 🔮 Future Testing (Phase 2 & 3)
- **[User Reviews Testing](./user-reviews-testing.md)** - Review and rating system
- **[Collections Testing](./collections-testing.md)** - User collections and favorites
- **[AI Recommendations Testing](./ai-recommendations-testing.md)** - Recommendation engine

## 🚀 Getting Started

### For Unit Test Implementation
1. **Review Implementation Plan**: Start with [Testing Implementation Plan](./testing-implementation-plan.md) to understand priorities
2. **Begin with HIGH Priority**: Implement `validation.test.ts` first for immediate coverage boost
3. **Follow the Roadmap**: Work through HIGH → MEDIUM → LOW priority tests
4. **Check Coverage**: Run `npm run test:coverage` after each implementation

### For Manual Testing
1. **Start with Core Setup**: Begin with [Core Setup Testing](./core-setup-testing.md) to verify your environment
2. **Test Admin Features**: Use [Admin CRUD Testing](./admin-crud-testing.md) to test data management
3. **Verify Public Pages**: Use [Public Pages Testing](./public-pages-testing.md) to test user experience
4. **Test Bulk Operations**: Use [CSV Upload Testing](./csv-upload-testing.md) to test data import

## 📊 Testing Workflow

### Before Development
1. Review relevant feature testing guide
2. Set up test environment with Docker
3. Run existing tests to ensure clean state

### During Development
1. Write tests alongside feature implementation
2. Follow TDD principles where applicable
3. Ensure all new code has appropriate test coverage

### Before Deployment
1. Run complete test suite
2. Execute manual testing checklist
3. Verify database migrations in test environment
4. Performance testing for critical paths

## 🔧 Test Environment Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Supabase CLI (for database testing)

### Quick Setup
```bash
# 1. Start test environment
docker-compose up -d

# 2. Run test suite
npm test

# 3. Run specific feature tests
npm test -- --testPathPattern=admin
```

### Database Testing
```bash
# Run schema validation tests
cd __tests__/schema
./run-schema-tests.sh
```

## 📊 Test Reporting

### Coverage Reports
- Generated automatically with Jest
- Available in `coverage/` directory
- HTML reports for detailed analysis

### Test Results
- Console output during development
- CI/CD integration for automated testing
- Detailed logs for debugging failures

## 🐛 Debugging Failed Tests

### Common Issues
1. **Database State**: Ensure clean test database
2. **Environment Variables**: Verify test environment configuration
3. **Async Operations**: Check for proper async/await handling
4. **Component Rendering**: Verify all required props and context

### Debug Tools
- Jest verbose mode: `npm test -- --verbose`
- React Testing Library debug: `screen.debug()`
- Supabase logs: Check test database logs
- Browser DevTools: For integration test debugging

## 🚀 Continuous Integration

### Automated Testing
- All tests run on pull request creation
- Deployment blocked on test failures
- Automatic test reports in PR comments

### Test Data Management
- Isolated test databases for each environment
- Automated test data seeding
- Cleanup procedures after test runs

## 📚 Related Documentation

- **[../design/](../design/)** - Design decisions and architecture
- **[../setup-instructions.md](../setup-instructions.md)** - Environment setup
- **[../../__tests__/](../../__tests__/)** - Test implementation files

## 🤝 Contributing to Tests

When adding new features:

1. **Create Feature Test Guide**: Document testing approach for new features
2. **Write Tests First**: Follow TDD principles where possible
3. **Update Test Plans**: Add new test cases to relevant testing guides
4. **Maintain Coverage**: Ensure test coverage meets project standards

## 📞 Questions?

For testing-related questions or debugging help, refer to the specific testing guides or reach out to the development team.
