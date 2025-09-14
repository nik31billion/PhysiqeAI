# Coach Glow Setup Instructions

## 🚀 Quick Setup

### 1. Run the Security Fix Migration (IMPORTANT!)
```bash
supabase db push --file database/migration_remove_coach_glow_view.sql
```

### 2. Set Environment Variables
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Test the Integration
1. Open your app
2. Go to Home, Plan, or Progress screen
3. Look for the floating ✨ button in the bottom-right corner
4. Tap it to open Coach Glow chat
5. Try asking: "I need motivation" or "What are good pre-workout snacks?"

## 🎯 What's Been Added

### Home Screen
- ✅ Clean Coach Glow section with:
  - Single input box with placeholder text
  - Matches app's design aesthetic
  - Clear subtitle explaining capabilities

### Plan Screen  
- ✅ Clickable "Ask Coach Glow about your plan..." input box

### Progress Screen
- ❌ No Coach Glow integration (as requested)

## 🔧 How to Use

### Basic Usage
1. **Home Screen**: Tap the "Ask Coach Glow anything..." input box
2. **Plan Screen**: Tap the "Ask Coach Glow about your plan..." input box
3. **Type your message** in the chat input
4. **Get AI response** from Coach Glow
5. **Apply plan changes** if suggested

### Example Messages to Try
- **Motivation**: "I'm feeling unmotivated today"
- **Plan Swap**: "I want to change my breakfast"
- **General**: "What are good pre-workout snacks?"

## 🛠️ Troubleshooting

### If Coach Glow doesn't respond:
1. Check your internet connection
2. Verify GEMINI_API_KEY is set correctly
3. Check Supabase function logs

### If the input box doesn't work:
1. Make sure you've imported the components
2. Check for any TypeScript errors
3. Restart your development server

## 📱 Features Available

- **Chat Interface**: Full conversation with Coach Glow
- **Plan Modifications**: Request meal/workout swaps
- **Motivation Support**: Get encouragement and advice
- **Chat History**: View previous conversations
- **Context Awareness**: Coach Glow knows your profile and progress

---

**Coach Glow is now ready to help your users achieve their fitness goals! 🎉**
