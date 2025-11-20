# Backend Build Guide

## Build and Error Detection

The backend build process is now configured to detect errors just like the frontend. Here's how to use it:

## Available Commands

### Development
```bash
npm run dev
```
- Runs in development mode with hot reload
- Automatically restarts on file changes
- Shows TypeScript errors in terminal

### Type Checking (Error Detection)
```bash
npm run type-check
```
- Checks for TypeScript errors **without building**
- Similar to frontend's lint check
- Fast way to detect errors before building
- **Exit code will be non-zero if errors found**

```bash
npm run type-check:watch
```
- Continuously checks for errors as you code
- Perfect for catching errors in real-time

### Building
```bash
npm run build
```
- **Automatically runs type-check first** (via prebuild hook)
- Compiles TypeScript to JavaScript
- **Will fail if any TypeScript errors are found**
- Outputs to `dist/` folder

```bash
npm run build:watch
```
- Continuously builds as files change
- Great for development

### Production
```bash
npm start
```
- Runs the compiled JavaScript from `dist/`
- Make sure to run `npm run build` first

## Error Detection Features

The TypeScript configuration now includes strict checking for:

✅ **Unused variables** - Detects unused local variables
✅ **Unused parameters** - Detects unused function parameters  
✅ **Missing returns** - Functions must have explicit return paths
✅ **Switch fallthrough** - Prevents accidental switch case fallthrough
✅ **Type errors** - All type mismatches are caught
✅ **Import errors** - Missing imports are detected
✅ **Case sensitivity** - File name case mismatches detected

## Build Process Flow

```
npm run build
    ↓
npm run type-check (prebuild hook)
    ↓
✓ No errors? → Compile TypeScript → Create dist/
✗ Errors? → Stop build → Show errors
```

## Example: Detecting Errors

### Before (errors might go unnoticed):
```bash
npm run build
# Might compile with warnings
```

### Now (errors are caught):
```bash
npm run build

> gtextsuite_backend@1.0.0 prebuild
> npm run type-check

> gtextsuite_backend@1.0.0 type-check
> tsc --noEmit

src/controllers/booking.ts:123:45 - error TS2345: 
Argument of type 'string' is not assignable to parameter of type 'number'.

123     const result = processBooking(bookingId);
                                           ~~~~~~

Found 1 error.
```

The build will **fail** until you fix the error, just like the frontend!

## Development Workflow

1. **Write code** → Save file
2. **Check for errors** → `npm run type-check:watch` (in separate terminal)
3. **Fix errors** → Type checker will update in real-time
4. **Build when ready** → `npm run build`
5. **Run** → `npm start`

## CI/CD Integration

For automated builds, the build will fail on errors:

```bash
# In CI pipeline
npm run build
# Exit code 0 = success, non-zero = errors found
```

## Troubleshooting

### Build fails with type errors
- Run `npm run type-check` to see all errors
- Fix errors one by one
- Use `npm run type-check:watch` for real-time feedback

### Want to build despite errors? (Not recommended)
- Remove the `prebuild` hook from package.json
- Or use: `tsc --noEmit false` (not recommended)

### Clear build cache
```bash
npm run clean
npm run build
```

## Summary

✅ **Type checking before build** - Catches errors early
✅ **Strict TypeScript config** - More error detection
✅ **Build fails on errors** - Like frontend Next.js build
✅ **Watch modes available** - Real-time error detection
✅ **Source maps generated** - Better debugging in production

