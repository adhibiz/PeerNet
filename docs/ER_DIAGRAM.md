# PeerNet Entity Relationship Diagram

Based on the entities and relationships identified in the PeerNet system.

```mermaid
erDiagram
    User {
        string userId PK
        string name
        string role
        string profileInformation
    }

    PeerSession {
        string sessionId PK
        string topic
        string duration
    }

    Whiteboard {
        string whiteboardId PK
        json sharedData
    }

    Contribution {
        string contributionId PK
        string type
        string details
    }

    CareerRoadmap {
        string roadmapId PK
        json skillRecommendations
        string guidance
    }

    LearningActivity {
        string activityId PK
        string type
        string content
    }

    %% Relationships

    User }|--|{ PeerSession : "participates in"
    PeerSession ||--|| Whiteboard : "uses"
    User ||--o{ Contribution : "creates"
    PeerSession ||--o{ Contribution : "contains"
    User ||--|| CareerRoadmap : "accesses"
    User ||--o{ LearningActivity : "records"
```

## Entity Descriptions

- **User**: Stores details of students and self-learners.
- **Peer Session**: Represents collaborative learning sessions.
- **Whiteboard**: Stores shared whiteboard data used during peer sessions.
- **Contribution**: Maintains records of user participation, peer support, and learning activities.
- **Career Roadmap**: Stores personalized career guidance and skill recommendations.
- **Learning Activity**: Records interactions such as discussions, doubts raised, and clarifications.
