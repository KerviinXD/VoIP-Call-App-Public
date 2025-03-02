using Microsoft.AspNetCore.Mvc;

[Route("api/call")]
[ApiController]
public class CallController : ControllerBase
{
    [HttpPost("start")]
    public IActionResult StartCall()
    {
        return Ok(new { message = "Call started!" });
    }
}
