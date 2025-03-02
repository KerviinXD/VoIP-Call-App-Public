using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace CallApp.Hubs
{
    public class CallHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> Users = new();

        public async Task RegisterUser(string userName)
        {
            if (string.IsNullOrEmpty(userName))
                return;

            Users[Context.ConnectionId] = userName;
            Console.WriteLine($"User Registered: {userName} ({Context.ConnectionId})");

            await Clients.All.SendAsync("UserJoined", userName, Users.Values.ToList());
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            if (Users.TryRemove(Context.ConnectionId, out string userName))
            {
                Console.WriteLine($"User Disconnected: {userName} ({Context.ConnectionId})");

                await Clients.All.SendAsync("UserLeft", userName, Users.Values.ToList());
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string user, string message)
        {
            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(message))
                return;

            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        private string GetConnectionId(string userName)
        {
            return Users.FirstOrDefault(u => u.Value.Equals(userName, StringComparison.OrdinalIgnoreCase)).Key;
        }

        public async Task SendOffer(string targetUser, string offerJson, string callerName)
        {
            var targetConnectionId = GetConnectionId(targetUser);
            if (string.IsNullOrEmpty(targetConnectionId))
            {
                Console.WriteLine($"Target user '{targetUser}' not found for offer.");
                return;
            }

            await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", offerJson, callerName);
        }

        public async Task SendAnswer(string targetUser, string answerJson)
        {
            var targetConnectionId = GetConnectionId(targetUser);
            if (string.IsNullOrEmpty(targetConnectionId))
            {
                Console.WriteLine($"Target user '{targetUser}' not found for answer.");
                return;
            }

            await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", answerJson);
        }

        public async Task SendIceCandidate(string targetUser, string candidateJson)
        {
            var targetConnectionId = GetConnectionId(targetUser);
            if (string.IsNullOrEmpty(targetConnectionId))
            {
                Console.WriteLine($"Target user '{targetUser}' not found for ICE candidate.");
                return;
            }

            await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", candidateJson);
        }
    }
}
