using Microsoft.AspNetCore.Mvc;

[Route("api/chat")]
[ApiController]
public class ChatController : ControllerBase
{
    [HttpPost("send")]
    public IActionResult SendMessage([FromBody] ChatMessage message)
    {
        return Ok(new { message = $"Message from {message.User}: {message.Text}" });
    }
}

public class ChatMessage
{
    public string User { get; set; }
    public string Text { get; set; }
}
