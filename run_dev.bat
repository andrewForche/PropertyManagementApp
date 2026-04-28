start cmd /k "cd .\Property-Management-Api\ && dotnet run web"
start cmd /k "cd .\Property-Management-Web\ && npm install && npm run dev"

timeout /t 1
start http://localhost:5173/