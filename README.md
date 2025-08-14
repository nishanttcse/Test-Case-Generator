# AI Test Case Generator

An intelligent web application that automatically generates comprehensive test cases for your GitHub repositories using AI. This tool streamlines the testing process by analyzing your code structure and generating relevant unit tests, integration tests, and edge case scenarios.

## 🚀 Project Overview

The AI Test Case Generator is a full-stack application that connects to your GitHub repositories, analyzes your code files, and uses artificial intelligence to generate meaningful test cases. It provides an intuitive workflow from code analysis to test generation and even automated pull request creation.

### Key Features

- **GitHub Integration**: Seamless authentication and repository access
- **Intelligent File Browser**: Advanced filtering, search, and file preview capabilities
- **AI-Powered Analysis**: Smart test case generation based on code structure and patterns
- **Test Case Management**: Organize, edit, and manage generated test suites
- **Automated PR Creation**: Generate pull requests with test files directly to your repository
- **Professional UI**: Modern, responsive interface with dark/light mode support

## 🏗️ Project Structure

\`\`\`
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main application with state management
│   └── globals.css         # Global styles and Tailwind configuration
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   ├── github-auth.tsx     # GitHub authentication component
│   ├── repository-selector.tsx # Repository selection interface
│   ├── file-browser.tsx    # Advanced file browser with filtering
│   ├── test-generation.tsx # AI test generation interface
│   ├── test-case-manager.tsx # Test case management and organization
│   └── pr-creator.tsx      # Pull request creation interface
├── lib/
│   ├── github-api.ts       # GitHub API integration service
│   ├── ai-service.ts       # AI service for test generation
│   ├── ai-actions.ts       # Secure server actions for AI calls
│   └── utils.ts            # Utility functions
└── hooks/
    └── use-mobile.tsx      # Mobile detection hook
\`\`\`

## 🔄 Workflow

1. **Authentication**: Connect your GitHub account securely
2. **Repository Selection**: Choose from your available repositories
3. **File Browser**: Navigate and select code files for test generation
4. **AI Analysis**: AI analyzes selected files and generates test case summaries
5. **Test Generation**: Review summaries and generate complete test code
6. **Test Management**: Organize tests into suites, edit, and manage
7. **PR Creation**: Automatically create pull requests with generated tests

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- GitHub account
- Gemini API key (for AI functionality)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/test-case-generator.git
   cd test-case-generator
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`

4. **GitHub OAuth Setup** (Optional for enhanced features)
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Add your callback URL: `http://localhost:3000`

### Running the Application

1. **Development Mode**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) in your browser

2. **Production Build**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

3. **Linting and Type Checking**
   \`\`\`bash
   npm run lint
   npm run type-check
   \`\`\`

## 🔧 Configuration

### AI Service Configuration

The application uses Google's Gemini AI for test generation through secure server actions. You can modify the AI service in `lib/ai-actions.ts` to:

- Adjust generation parameters (temperature, max tokens)
- Customize prompts for different test types
- Switch to different AI providers (OpenAI, Anthropic, etc.)

### GitHub API Configuration

GitHub integration is handled through `lib/github-api.ts`. The service supports:

- Repository listing and file browsing
- File content retrieval
- Branch creation and file commits
- Pull request creation

## 🔒 Security

The application implements secure practices:

- **Server-side AI calls**: API keys are never exposed to the client
- **Secure authentication**: GitHub tokens are handled securely
- **Environment variables**: Sensitive data is kept server-side only

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching based on system preference
- **Modern Animations**: Smooth transitions and hover effects
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Professional Typography**: Clean, readable fonts optimized for developer tools

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`: Your Gemini API key
4. Deploy automatically on every push

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔮 Future Enhancements

- Support for multiple programming languages
- Integration with popular testing frameworks (Jest, Mocha, Pytest)
- Code coverage analysis
- Batch processing for multiple repositories
- Team collaboration features
- Custom test templates

## 🎯 Conclusion

The AI Test Case Generator represents a significant step forward in automated testing workflows. By combining the power of artificial intelligence with intuitive user experience design, it transforms the traditionally time-consuming process of writing test cases into an efficient, intelligent workflow.

This tool not only saves developers valuable time but also ensures comprehensive test coverage by identifying edge cases and scenarios that might be overlooked in manual testing. The seamless integration with GitHub and automated PR creation makes it easy to incorporate generated tests into existing development workflows.

Whether you're working on a small personal project or managing large-scale enterprise applications, the AI Test Case Generator provides the tools and intelligence needed to maintain high-quality, well-tested codebases with minimal manual effort.

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Google Gemini AI**
