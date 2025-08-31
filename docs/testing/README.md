# Testing Documentation

This directory contains all testing strategies, plans, and guides for the AI School Recommend App.

## 📋 Document Index

### Core Testing Documents
- **[testing-guide.md](./testing-guide.md)** - Comprehensive testing guide and troubleshooting
- **[testing-plan.md](./testing-plan.md)** - Overall testing strategy and methodology

### Feature Testing Guides
- **[features/admin-crud-testing.md](./features/admin-crud-testing.md)** - Admin CRUD operations testing
- **[features/admin-reviews-testing.md](./features/admin-reviews-testing.md)** - Admin review management testing
- **[features/core-setup-testing.md](./features/core-setup-testing.md)** - Basic setup and configuration testing
- **[features/csv-upload-testing.md](./features/csv-upload-testing.md)** - CSV bulk upload testing
- **[features/public-pages-testing.md](./features/public-pages-testing.md)** - Public browsing pages testing
- **[features/user-reviews-testing.md](./features/user-reviews-testing.md)** - User review system testing
- **[features/collections-testing.md](./features/collections-testing.md)** - Collections and favorites testing
- **[features/ai-recommendations-testing.md](./features/ai-recommendations-testing.md)** - AI recommendations testing

## 🧪 Testing Strategy

### Testing Levels
1. **Unit Tests**: Individual component and function testing with Jest
2. **Integration Tests**: Feature workflow testing with React Testing Library
3. **E2E Tests**: Full user journey testing (planned with Playwright)
4. **Manual Testing**: Feature-specific testing checklists

### Test Coverage Goals
- **Components**: 90%+ coverage for UI components
- **Business Logic**: 95%+ coverage for core functions
- **API Routes**: 100% coverage for all endpoints
- **Database**: Schema validation and migration testing

### Testing Tools
- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Supabase Test Client**: Database testing with isolated environments
- **Docker**: Consistent testing environments

## 🎯 Testing Workflow

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
