# Plan

## 📌 Technical Lead – Project Plan  
**Project:** Console app that prints the sum of all prime numbers `< 100`  
**Tech Stack:** .NET 8 (C#), xUnit for unit testing, dotnet CLI  

---

### 🎯 Goal
Create a self‑contained console application that outputs `1060` (the sum of primes < 100) and provide a full suite of unit tests covering the core logic.

---

## Milestone 1 – Project Setup  
**Duration:** ~30 min

| Task | Description | Deliverable |
|------|-------------|-------------|
| **1.1** | Install .NET SDK (if not already installed). | `dotnet --version` shows ≥ 8.0 |
| **1.2** | Create a new solution folder (`PrimeSumSolution`). | Directory structure: `PrimeSumSolution/` |
| **1.3** | Add console project (`PrimeSumApp`). | `PrimeSumSolution/PrimeSumApp/PrimeSumApp.csproj` |
| **1.4** | Add test project (`PrimeSumTests`). | `PrimeSumSolution/PrimeSumTests/PrimeSumTests.csproj` |
| **1.5** | Add xUnit & Microsoft.NET.Test.Sdk to test project via CLI. | `dotnet add PrimeSumTests package xunit` + `Microsoft.NET.Test.Sdk` |
| **1.6** | Verify that tests can run (`dotnet test`). | All tests pass (no tests yet). |

> **Tip:** Use the following commands:
> ```bash
> dotnet new sln -n PrimeSumSolution
> dotnet new console -n PrimeSumApp
> dotnet new xunit -n PrimeSumTests
> dotnet sln add PrimeSumApp/PrimeSumApp.csproj
> dotnet sln add PrimeSumTests/PrimeSumTests.csproj
> dotnet add PrimeSumTests reference PrimeSumApp/PrimeSumApp.csproj
> ```

---

## Milestone 2 – Core Implementation  
**Duration:** ~1 h

| Task | Description | Deliverable |
|------|-------------|-------------|
| **2.1** | Create a static helper class `PrimeHelper` in `PrimeSumApp`. | `PrimeHelper.cs` with two public methods: `bool IsPrime(int n)` and `int SumPrimesLessThan(int limit)`. |
| **2.2** | Implement `IsPrime`: handle edge cases (`n < 2`, even numbers, trial division up to √n). | Unit‑testable method. |
| **2.3** | Implement `SumPrimesLessThan`: iterate from 2 to `limit-1`, accumulate primes using `IsPrime`. | Returns correct sum for any limit. |
| **2.4** | Update `Program.cs` to call `PrimeHelper.SumPrimesLessThan(100)` and print the result. | Console output: `1060`. |
| **2.5** | Add XML documentation comments for public methods. | Good maintainability. |

> **Code snippet (simplified):**
> ```csharp
> public static class PrimeHelper
> {
>     public static bool IsPrime(int n)
>     {
>         if (n < 2) return false;
>         if (n == 2) return true;
>         if (n % 2 == 0) return false;
>         int limit = (int)Math.Sqrt(n);
>         for (int i = 3; i <= limit; i += 2)
>             if (n % i == 0) return false;
>         return true;
>     }
>
>     public static int SumPrimesLessThan(int limit)
>     {
>         int sum = 0;
>         for (int i = 2; i < limit; i++)
>             if (IsPrime(i)) sum += i;
>         return sum;
>     }
> }
> ```

---

## Milestone 3 – Unit Tests  
**Duration:** ~1 h

| Task | Description | Deliverable |
|------|-------------|-------------|
| **3.1** | Create a test class `PrimeHelperTests`. | `PrimeHelperTests.cs` |
| **3.2** | Write `[Theory]` tests for `IsPrime`: provide known primes and non‑primes (e.g., 2,3,5,7,11 vs 0,1,4,6,8). | All pass. |
| **3.3** | Write a `[Fact]` test that verifies `SumPrimesLessThan(100)` returns `1060`. | Passes. |
| **3.4** | Add edge‑case tests: limit < 2 (expect sum = 0), limit = 2 (sum = 0). | Passes. |
| **3.5** | Run `dotnet test` to ensure all tests succeed. | Test coverage > 80 % (optional). |

> **Sample test code:**
> ```csharp
> public class PrimeHelperTests
> {
>     [Theory]
>     [InlineData(2, true)]
>     [InlineData(3, true)]
>     [InlineData(4, false)]
>     [InlineData(17, true)]
>     [InlineData(18, false)]
>     public void IsPrime_ReturnsExpected(int number, bool expected)
>     {
>         Assert.Equal(expected, PrimeHelper.IsPrime(number));
>     }
>
>     [Fact]
>     public void SumPrimesLessThan_100_Returns1060()
>     {
>         Assert.Equal(1060, PrimeHelper.SumPrimesLessThan(100));
>     }
>
>     [Theory]
>     [InlineData(1, 0)]
>     [InlineData(2, 0)]
>     public void SumPrimesLessThan_EdgeCases_ReturnsZero(int limit, int expectedSum)
>     {
>         Assert.Equal(expectedSum, PrimeHelper.SumPrimesLessThan(limit));
>     }
> }
> ```

---

## Milestone 4 – Integration & Build  
**Duration:** ~30 min

| Task | Description | Deliverable |
|------|-------------|-------------|
| **4.1** | Run the console app (`dotnet run --project PrimeSum